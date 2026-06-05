import { createHash, randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleIdTokenVerifier } from './google-id-token.verifier';

const BCRYPT_ROUNDS = 12;

export type AuthTokenResponse = {
  access_token: string;
  refresh_token: string;
  emailVerified: boolean;
};

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
    private readonly googleIdToken: GoogleIdTokenVerifier,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokenResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const emailVerificationToken = randomBytes(32).toString('hex');
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        emailVerificationToken,
      },
    });

    try {
      await this.email.sendVerificationEmail(user.email, emailVerificationToken);
    } catch (e) {
      this.log.warn(
        `Verification email was not sent for ${user.email}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    return await this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('This account uses Google sign-in');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return await this.issueTokens(user);
  }

  async loginWithGoogle(credential: string): Promise<AuthTokenResponse> {
    let googleUser: { sub: string; email: string; emailVerified: boolean };
    try {
      googleUser = await this.googleIdToken.verify(credential);
    } catch {
      throw new UnauthorizedException('Could not verify Google account');
    }

    const byGoogleId = await this.prisma.user.findUnique({
      where: { googleId: googleUser.sub },
    });
    if (byGoogleId) {
      return await this.issueTokens(byGoogleId);
    }

    const byEmail = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });
    if (byEmail) {
      if (byEmail.googleId && byEmail.googleId !== googleUser.sub) {
        throw new UnauthorizedException('Could not verify Google account');
      }
      const linked = await this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: googleUser.sub,
          emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(),
        },
      });
      return await this.issueTokens(linked);
    }

    const created = await this.prisma.user.create({
      data: {
        email: googleUser.email,
        googleId: googleUser.sub,
        emailVerifiedAt: new Date(),
      },
    });

    return await this.issueTokens(created);
  }

  async verifyEmailToken(token: string): Promise<AuthTokenResponse> {
    if (!token || token.length < 32) {
      throw new BadRequestException('Invalid verification link');
    }

    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired verification link');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      },
    });

    return await this.issueTokens(updated);
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.emailVerifiedAt) {
      throw new BadRequestException('Email is already verified');
    }

    const emailVerificationToken = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken },
    });

    await this.email.sendVerificationEmail(user.email, emailVerificationToken);
  }

  async getMe(userId: string): Promise<{
    email: string;
    emailVerified: boolean;
    canDeleteAccount: boolean;
    isSuperAdmin: boolean;
  }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      email: user.email,
      emailVerified: !!user.emailVerifiedAt,
      canDeleteAccount: true,
      isSuperAdmin: user.isSuperAdmin,
    };
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }

    await this.prisma.user.delete({ where: { id: userId } });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || !user.passwordHash) return;

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
    });

    try {
      await this.email.sendPasswordResetEmail(user.email, token);
    } catch (e) {
      this.log.warn(
        `Password reset email not sent for ${user.email}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || token.length < 32) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });
  }

  async refresh(rawToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const newRaw = randomBytes(40).toString('hex');
    const newHash = createHash('sha256').update(newRaw).digest('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: newHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const user = stored.user;
    const payload = {
      sub: user.id,
      email: user.email,
      emailVerified: !!user.emailVerifiedAt,
    };
    const access_token = await this.jwt.signAsync(payload);
    return { access_token, refresh_token: newRaw };
  }

  async logout(rawToken: string): Promise<void> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllTokensForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(user: {
    id: string;
    email: string;
    emailVerifiedAt: Date | null;
  }): Promise<AuthTokenResponse> {
    const emailVerified = !!user.emailVerifiedAt;
    const payload = {
      sub: user.id,
      email: user.email,
      emailVerified,
    };
    const access_token = await this.jwt.signAsync(payload);

    const rawRefresh = randomBytes(40).toString('hex');
    const tokenHash = createHash('sha256').update(rawRefresh).digest('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { access_token, refresh_token: rawRefresh, emailVerified };
  }
}
