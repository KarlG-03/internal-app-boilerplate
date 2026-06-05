import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { json } from 'body-parser';
import { AppModule } from './app.module';

export async function createApp() {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set when NODE_ENV=production');
  }

  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use(json());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const origins = process.env.CORS_ORIGIN?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV === 'production' && !origins?.length) {
    throw new Error('CORS_ORIGIN must be set when NODE_ENV=production');
  }

  app.enableCors({
    origin: origins?.length ? origins : true,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  return app;
}

