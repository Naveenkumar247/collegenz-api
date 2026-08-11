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
  async googleAuth(@Req() req: any) {}

  // 2. GET /api/v1/auth/google/callback
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.validateGoogleUser(req.user);

    // 🟢 Fallback to your Vercel frontend domain if environment variable is missing
    const rawFrontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'https://collegenz.in';

    // Remove any trailing slash to prevent double-slashes (e.g. collegenz.in//login)
    const frontendUrl = rawFrontendUrl.replace(/\/$/, '');

    // Redirect straight to Vercel with the generated token
    return res.redirect(`${frontendUrl}/login?token=${result.token}`);
  }
}
