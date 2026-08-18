import { Controller, Get, Post, Body, UseGuards, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
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

  // 1. TRADITIONAL EMAIL/PASSWORD LOGIN
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    // Calls your auth.service to validate credentials and issue JWT
    return this.authService.login(body.email, body.password);
  }

  // 2. INITIATE GOOGLE OAUTH
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  // 3. GOOGLE OAUTH CALLBACK
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const result = await this.authService.validateGoogleUser(req.user);
    
    // Clean and enforce absolute FRONTEND_URL to prevent path stacking
    let frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://collegenz.in';
    frontendUrl = frontendUrl.replace(/^["']|["']$/g, '').trim().replace(/\/$/, '');

    if (!frontendUrl.startsWith('http://') && !frontendUrl.startsWith('https://')) {
      frontendUrl = `https://${frontendUrl}`;
    }

    return res.redirect(`${frontendUrl}/login?token=${result.token}`);
  }
}
