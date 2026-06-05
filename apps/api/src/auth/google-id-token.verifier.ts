import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export type GoogleIdTokenPayload = {
  sub: string;
  email: string;
  emailVerified: boolean;
};

@Injectable()
export class GoogleIdTokenVerifier {
  private readonly log = new Logger(GoogleIdTokenVerifier.name);
  private readonly client: OAuth2Client | null;

  constructor(private readonly config: ConfigService) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    this.client = clientId ? new OAuth2Client(clientId) : null;
  }

  async verify(credential: string): Promise<GoogleIdTokenPayload> {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!this.client || !clientId) {
      this.log.error('GOOGLE_CLIENT_ID is not configured');
      throw new Error('GOOGLE_NOT_CONFIGURED');
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email) {
        throw new Error('INVALID_PAYLOAD');
      }
      if (payload.email_verified !== true) {
        throw new Error('EMAIL_NOT_VERIFIED');
      }
      return {
        sub: payload.sub,
        email: payload.email.toLowerCase(),
        emailVerified: true,
      };
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message === 'GOOGLE_NOT_CONFIGURED' ||
          e.message === 'INVALID_PAYLOAD' ||
          e.message === 'EMAIL_NOT_VERIFIED')
      ) {
        throw e;
      }
      this.log.warn(
        `Google ID token verification failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      throw new Error('VERIFY_FAILED');
    }
  }
}
