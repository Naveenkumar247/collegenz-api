import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../users/schema/user.schema';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy'; // 🟢 IMPORTED

@Module({
  imports: [
    // 1. Core Passport middleware configuration context
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // 2. Open up access to the User schema inside the cluster layer
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    
    // 3. Tokens signing configuration mapping
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallbackSecretKey',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    GoogleStrategy,
    JwtStrategy // 🟢 ADDED TO PROVIDERS
  ],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
