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

  // 2. Global CORS Configuration (🟢 FIXED: Prevents CORS breakdown with credentials)
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

      // Allow requests with no origin (mobile apps, server-to-server)
      // or allowed domains / Vercel previews (*.vercel.app)
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

  // 4. API Versioning Control (/api/v1/...)
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // 5. Request Body Validation (🟢 FIXED: Set whitelist to false if using raw @Body() body: any)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // Prevents NestJS from wiping @Body() payloads when DTO classes are not used
      transform: true,
    }),
  );

  const port = process.env.PORT || 10000;
  
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 CollegenZ API core running on: http://0.0.0.0:${port}/api/v1`);
}
bootstrap();
