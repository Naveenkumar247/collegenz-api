import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Security Headers (🟢 FIXED: Modified cross-origin policies to stop blocking Vercel)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'unsafe-none' },
    }),
  );

  // 2. Global CORS Configuration (Optimized for React Client requests)
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // 3. Performance Optimization (Gzip compression)
  app.use(compression());

  // 4. API Versioning Control (e.g., /api/v1/posts)
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // 5. Enterprise-grade Request Body Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,         // Strips away payload properties not explicitly defined in DTOs
      transform: true,         // Automatically transforms payloads to match expected TS types
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3000;
  
  // Bind the network listener across the container threshold
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 CollegenZ API core running on: http://0.0.0.0:${port}/api/v1`);
}
bootstrap();
