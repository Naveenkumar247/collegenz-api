import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // 1. Global Environment Configuration Setup
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),

    // 2. Optimized Database Pooling Pool Setup (Replacing old manual config)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10, // Increased for future scale
      }),
    }),

    // 3. Security: Global Rate Limiting Safeguard
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // max 100 requests per IP address
    }]),

    // Placeholder array for our feature modules to be generated next
    // AuthModule, UsersModule, PostsModule, MessagesModule
  ],
  controllers: [],
  providers: [
    // Enforces rate-limiting transparently across every endpoint route by default
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

