import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // 1. GET /api/v1/auth/google
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport AuthGuard automatically initiates redirect to Google OAuth
  }

  // 2. GET /api/v1/auth/google/callback
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    let frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://collegenz.in';
    frontendUrl = frontendUrl.replace(/^["']|["']$/g, '').trim();

    if (!frontendUrl.startsWith('http://') && !frontendUrl.startsWith('https://')) {
      frontendUrl = `https://${frontendUrl}`;
    }
    frontendUrl = frontendUrl.replace(/\/$/, '');

    try {
      const result = await this.authService.validateGoogleUser(req.user);
      return res.redirect(`${frontendUrl}/login?token=${result.token}`);
    } catch (error) {
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }
}
