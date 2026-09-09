import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import {
  User,
  UserSchema,
} from '../users/schema/user.schema';

import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // ============================================
    // PASSPORT
    // ============================================
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    // ============================================
    // USER MODEL
    // ============================================
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),

    // ============================================
    // JWT
    // ============================================
    JwtModule.register({
      secret: process.env.JWT_SECRET,

      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],

  // ============================================
  // CONTROLLERS
  // ============================================
  controllers: [
    AuthController,
  ],

  // ============================================
  // PROVIDERS
  // ============================================
  providers: [
    AuthService,
    GoogleStrategy,
    JwtStrategy,
  ],

  // ============================================
  // EXPORTS
  // ============================================
  exports: [
    AuthService,
    PassportModule,
  ],
})
export class AuthModule {}
