import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// 1. IMPORT YOUR FEATURE MODULES HERE
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

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
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // 2. REGISTER THEM HERE SO NESTJS WAKES UP THEIR CONTROLLERS
    UsersModule,
    AuthModule,
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
