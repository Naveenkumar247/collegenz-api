import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'unsafe-none' },
    }),
  );

  // 2. Global CORS Configuration
  app.enableCors({
    origin: (origin, callback) => {
      const envOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
        : [];

      const allowedOrigins = [
        'https://collegenz.in',
        'https://www.collegenz.in',
        'http://localhost:3000',
        'http://localhost:5173',
        ...envOrigins,
      ];

      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // 3. Performance Optimization (Gzip compression)
  app.use(compression());

  // 4. API Versioning Control -> Creates /api/v1/...
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // 5. Request Body Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
    }),
  );

  const port = process.env.PORT || 10000;
  
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 CollegenZ API core running on: http://0.0.0.0:${port}/api/v1`);
}

bootstrap();
