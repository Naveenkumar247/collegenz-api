import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ============================================
  // EMAIL / PASSWORD LOGIN
  // ============================================
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any, @Req() req: Request) {
    return this.authService.login(body, req);
  }

  // ============================================
  // START GOOGLE OAUTH
  // ============================================
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request) {
    // Passport handles the redirect to Google.
    return;
  }

  // ============================================
  // GOOGLE OAUTH CALLBACK
  // ============================================
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      if (!req.user) {
        return res.redirect(
          this.getFrontendUrl('/login?error=google_auth_failed'),
        );
      }

      const result = await this.authService.validateGoogleUser(req.user);

      if (!result?.token) {
        return res.redirect(
          this.getFrontendUrl('/login?error=token_generation_failed'),
        );
      }

      const frontendUrl = this.getFrontendUrl('/login');

      return res.redirect(
        `${frontendUrl}?token=${encodeURIComponent(result.token)}`,
      );
    } catch (error) {
      console.error('❌ Google OAuth callback error:', error);

      return res.redirect(
        this.getFrontendUrl('/login?error=google_login_failed'),
      );
    }
  }

  // ============================================
  // FRONTEND URL HELPER
  // ============================================
  private getFrontendUrl(path: string): string {
    let frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'https://collegenz.in';

    frontendUrl = frontendUrl
      .replace(/^["']|["']$/g, '')
      .trim()
      .replace(/\/+$/, '');

    if (
      !frontendUrl.startsWith('http://') &&
      !frontendUrl.startsWith('https://')
    ) {
      frontendUrl = `https://${frontendUrl}`;
    }

    return `${frontendUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
}
