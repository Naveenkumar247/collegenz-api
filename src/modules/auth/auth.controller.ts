
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
  // Clicking this link redirects the browser straight to Google's Login screen
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  // 2. GET /api/v1/auth/google/callback
  // Google redirects users here. We log them in and forward them to the frontend with their token.
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const result = await this.authService.validateGoogleUser(req.user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    
    // Send the token safely to the frontend via a URL query parameter
return res.redirect(`${frontendUrl}/login?token=${result.token}`);
    
  }
}
