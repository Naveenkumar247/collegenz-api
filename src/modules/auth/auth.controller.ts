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
    // Passport AuthGuard automatically redirects user to Google Consent Screen
  }

  // 2. GET /api/v1/auth/google/callback
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.validateGoogleUser(req.user);

    let frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://collegenz.in';

    // Ensure frontendUrl starts with protocol to prevent Express relative-path redirects
    if (!frontendUrl.startsWith('http://') && !frontendUrl.startsWith('https://')) {
      frontendUrl = `https://${frontendUrl}`;
    }

    frontendUrl = frontendUrl.replace(/\/$/, '');

    return res.redirect(`${frontendUrl}/login?token=${result.token}`);
  }
}
