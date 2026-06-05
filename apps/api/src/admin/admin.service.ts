import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from '../auth/auth.service';

export type AdminUserSummary = {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  emailVerified: boolean;
  createdAt: Date;
  activeSessionCount: number;
};

export type AdminSession = {
  id: string;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {}

  async bootstrap(email: string, secret: string): Promise<{ message: string }> {
    const expectedSecret = this.config.get<string>('ADMIN_BOOTSTRAP_SECRET');
    if (!expectedSecret || secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid bootstrap secret');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.isSuperAdmin) {
      throw new ConflictException('User is already a superadmin');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isSuperAdmin: true },
    });

    return { message: `${email} is now a superadmin` };
  }

  async getStats(): Promise<{
    userCount: number;
    activeSessionCount: number;
  }> {
    const [userCount, activeSessionCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.refreshToken.count({
        where: { revokedAt: null, expiresAt: { gt: new Date() } },
      }),
    ]);
    return { userCount, activeSessionCount };
  }

  async listUsers(): Promise<AdminUserSummary[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        isSuperAdmin: true,
        emailVerifiedAt: true,
        createdAt: true,
        refreshTokens: {
          where: { revokedAt: null, expiresAt: { gt: new Date() } },
          select: { id: true },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      isSuperAdmin: u.isSuperAdmin,
      emailVerified: !!u.emailVerifiedAt,
      createdAt: u.createdAt,
      activeSessionCount: u.refreshTokens.length,
    }));
  }

  async getUser(userId: string): Promise<AdminUserSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isSuperAdmin: true,
        emailVerifiedAt: true,
        createdAt: true,
        refreshTokens: {
          where: { revokedAt: null, expiresAt: { gt: new Date() } },
          select: { id: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      emailVerified: !!user.emailVerifiedAt,
      createdAt: user.createdAt,
      activeSessionCount: user.refreshTokens.length,
    };
  }

  async getUserSessions(userId: string): Promise<AdminSession[]> {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userAgent: true, createdAt: true, expiresAt: true },
    });
    return tokens;
  }

  async revokeUserTokens(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');
    await this.authService.revokeAllTokensForUser(userId);
  }

  async revokeSession(tokenId: string): Promise<void> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
      select: { id: true, revokedAt: true },
    });
    if (!token) throw new NotFoundException('Session not found');
    if (token.revokedAt) throw new BadRequestException('Session already revoked');

    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }

  async toggleSuperAdmin(
    targetUserId: string,
    requestingUserId: string,
  ): Promise<{ isSuperAdmin: boolean }> {
    if (targetUserId === requestingUserId) {
      throw new BadRequestException('Cannot modify your own superadmin status');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { isSuperAdmin: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isSuperAdmin: !user.isSuperAdmin },
      select: { isSuperAdmin: true },
    });
    return { isSuperAdmin: updated.isSuperAdmin };
  }

  async deleteUser(targetUserId: string, requestingUserId: string): Promise<void> {
    if (targetUserId === requestingUserId) {
      throw new BadRequestException('Cannot delete your own account via admin');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.delete({ where: { id: targetUserId } });
  }
}
