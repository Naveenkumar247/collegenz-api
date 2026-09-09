import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const clean = (value?: string): string | undefined => {
      return value
        ?.replace(/^["']|["']$/g, '')
        .trim();
    };

    const clientID = clean(
      configService.get<string>('GOOGLE_CLIENT_ID'),
    );

    const clientSecret = clean(
      configService.get<string>('GOOGLE_CLIENT_SECRET'),
    );

    let callbackURL = clean(
      configService.get<string>('GOOGLE_CALLBACK_URL'),
    );

    // Always use an absolute OAuth callback URL
    if (
      !callbackURL ||
      !/^https?:\/\//i.test(callbackURL)
    ) {
      callbackURL =
        'https://api.collegenz.in/api/v1/auth/google/callback';
    }

    console.log('🔐 Google OAuth configuration:', {
      clientIDConfigured: !!clientID,
      clientSecretConfigured: !!clientSecret,
      callbackURL,
    });

    super({
      clientID: clientID || 'TEMP_HOLDER_ID',
      clientSecret: clientSecret || 'TEMP_HOLDER_SECRET',
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const email =
        profile?.emails?.[0]?.value
          ?.trim()
          ?.toLowerCase();

      const givenName =
        profile?.name?.givenName?.trim() || '';

      const familyName =
        profile?.name?.familyName?.trim() || '';

      const displayName =
        profile?.displayName?.trim() || '';

      // IMPORTANT:
      // AuthService expects `name`, not firstName/lastName.
      const name =
        displayName ||
        `${givenName} ${familyName}`.trim() ||
        email?.split('@')[0] ||
        'CollegenZ User';

      const picture =
        profile?.photos?.[0]?.value || '';

      if (!email) {
        console.error(
          '❌ Google did not provide an email address.',
        );

        return done(
          new UnauthorizedException(
            'Google account email was not provided.',
          ),
          false,
        );
      }

      const user = {
        email,
        name,
        picture,

        // Keep these if you need them elsewhere.
        firstName: givenName,
        lastName: familyName,

        googleId: profile?.id,

        accessToken,
      };

      console.log('🟢 Google profile validated:', {
        email: user.email,
        name: user.name,
        hasPicture: !!user.picture,
      });

      return done(null, user);
    } catch (error) {
      console.error(
        '❌ Google strategy validation error:',
        error,
      );

      return done(error, false);
    }
  }
}
