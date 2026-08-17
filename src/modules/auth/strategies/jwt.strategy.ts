import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    // Clean and sanitize JWT_SECRET to strip quotes, spaces, and newlines
    const secret = (configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET || '')
      .replace(/^["']|["']$/g, '')
      .trim();

    if (!secret) {
      throw new Error('JWT_SECRET is missing from environment variables.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    if (!payload || (!payload.sub && !payload.id && !payload._id)) {
      throw new UnauthorizedException('Invalid token payload.');
    }

    // Attach complete identity object to req.user for use in controllers
    return {
      userId: payload.sub || payload.id || payload._id,
      email: payload.email,
      role: payload.role || payload.zrole || 'user',
    };
  }
}
