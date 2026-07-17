// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
// ... other imports
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy'; // 🟢 IMPORT THIS

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallbackSecretKey',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    GoogleStrategy,
    JwtStrategy // 🟢 ADD THIS TO PROVIDERS
  ],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
