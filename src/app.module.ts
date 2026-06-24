import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

// Core Feature Module Imports
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostsModule } from './modules/posts/posts.module';

@Controller('')
class AppController {
  @Get()
  getHello() {
    return {
      status: 'online',
      message: 'Welcome to the CollegenZ Enterprise API Portal',
      version: '1.0.0'
    };
  }
}

@Module({
  imports: [
    // 1. Global Environment Variables Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Global Shared JWT Configuration (Ensures Guards can verify tokens anywhere)
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),

    // 3. Database Connection Pool Setup
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        // 🟢 Cleaned up: Let the direct URI string handle the namespace routing entirely
      }),
    }),
    

    // 4. Global Security Rate Limiting API Safeguard
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // 5. Registered Active Business Domain Modules
    UsersModule,
    AuthModule,
    PostsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
