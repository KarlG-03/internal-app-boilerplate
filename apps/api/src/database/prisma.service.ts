import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { resolveDatabaseUrl } from './resolve-database-url';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: resolveDatabaseUrl(
            config.get<string>('POSTGRES_PRISMA_URL') ??
              config.get<string>('DATABASE_URL'),
          ),
        },
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (process.env.VERCEL) return;
    await this.$disconnect();
  }
}
