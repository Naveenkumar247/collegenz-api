import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from '../users/schema/user.schema';

import { JwtService } from '@nestjs/jwt';

import { v4 as uuidv4 } from 'uuid';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly jwtService: JwtService,
  ) {}

  // ============================================
  // EMAIL / PASSWORD LOGIN
  // ============================================
  async login(loginDto: any, req: any) {
    const email = loginDto?.email?.trim()?.toLowerCase();
    const password = loginDto?.password;

    if (!email || !password) {
      throw new UnauthorizedException(
        'Email and password are required.',
      );
    }

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password credentials.',
      );
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'This account uses Google login. Please continue with Google.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid email or password credentials.',
      );
    }

    const currentSession = {
      sessionId: uuidv4(),

      deviceAgent:
        req?.headers?.['user-agent'] ||
        'Unknown Connection Agent',

      ipAddress:
        req?.ip ||
        req?.connection?.remoteAddress ||
        '127.0.0.1',

      loginTime: new Date(),

      lastActive: new Date(),
    };

    await this.userModel.updateOne(
      { _id: user._id },
      {
        $push: {
          activeSessions: currentSession,
        },
      },
    );

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      sessionId: currentSession.sessionId,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        picture: user.picture,
      },
    };
  }

  // ============================================
  // GOOGLE LOGIN
  // ============================================
  async validateGoogleUser(googleProfile: any) {
    console.log('🔵 Google profile received');

    if (!googleProfile) {
      throw new UnauthorizedException(
        'Google profile was not received.',
      );
    }

    // --------------------------------------------
    // Extract Google information safely
    // --------------------------------------------

    const email = googleProfile.email
      ?.trim()
      ?.toLowerCase();

    const name =
      googleProfile.name?.trim() ||
      googleProfile.displayName?.trim() ||
      `${googleProfile.firstName || ''} ${
        googleProfile.lastName || ''
      }`.trim() ||
      email?.split('@')[0] ||
      'CollegenZ User';

    const picture =
      googleProfile.picture ||
      googleProfile.photo ||
      googleProfile.photos?.[0]?.value ||
      'https://collegenz.in/uploads/profilepic.jpg';

    if (!email) {
      throw new UnauthorizedException(
        'Google account email was not received.',
      );
    }

    console.log('🔵 Google user:', {
      email,
      name,
    });

    // --------------------------------------------
    // Find existing user
    // --------------------------------------------

    let user = await this.userModel.findOne({
      email,
    });

    // --------------------------------------------
    // Create new user
    // --------------------------------------------

    if (!user) {
      const username = await this.generateUniqueUsername(
        email,
      );

      console.log('🟢 Creating Google user:', {
        email,
        name,
        username,
      });

      user = await this.userModel.create({
        name: name,

        email: email,

        username: username,

        picture: picture,

        googleUser: true,

        activeSessions: [],
      });
    } else {
      // ------------------------------------------
      // Existing user
      // ------------------------------------------
      // Google users may have old/incomplete data.
      // Make sure required name is available.
      // ------------------------------------------

      const updateData: any = {};

      if (!user.name && name) {
        updateData.name = name;
      }

      if (!user.picture && picture) {
        updateData.picture = picture;
      }

      if (
        user.googleUser !== true
      ) {
        updateData.googleUser = true;
      }

      if (Object.keys(updateData).length > 0) {
        await this.userModel.updateOne(
          { _id: user._id },
          { $set: updateData },
        );

        user = await this.userModel.findById(
          user._id,
        );
      }
    }

    if (!user) {
      throw new UnauthorizedException(
        'Unable to create or retrieve Google user.',
      );
    }

    // --------------------------------------------
    // Create session
    // --------------------------------------------

    const currentSession = {
      sessionId: uuidv4(),

      deviceAgent:
        'Google OAuth Handshake Stream',

      ipAddress:
        'OAUTH_GATEWAY',

      loginTime: new Date(),

      lastActive: new Date(),
    };

    await this.userModel.updateOne(
      { _id: user._id },
      {
        $push: {
          activeSessions: currentSession,
        },
      },
    );

    // --------------------------------------------
    // JWT
    // --------------------------------------------

    const payload = {
      sub: user._id.toString(),

      email: user.email,

      sessionId:
        currentSession.sessionId,
    };

    const token =
      this.jwtService.sign(payload);

    console.log(
      '🟢 Google login successful:',
      user.email,
    );

    return {
      token,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        username: user.username,

        picture: user.picture,
      },
    };
  }

  // ============================================
  // UNIQUE USERNAME GENERATOR
  // ============================================
  private async generateUniqueUsername(
    email: string,
  ): Promise<string> {
    const baseUsername =
      email
        .split('@')[0]
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
        .slice(0, 20) || 'user';

    let username = baseUsername;

    let exists = await this.userModel.exists({
      username,
    });

    let counter = 1;

    while (exists) {
      username = `${baseUsername}${Math.floor(
        100 + Math.random() * 900,
      )}`;

      exists = await this.userModel.exists({
        username,
      });

      counter++;

      // Safety fallback
      if (counter > 20) {
        username = `${baseUsername}${Date.now()}`;
        break;
      }
    }

    return username;
  }

  // ============================================
  // LOGOUT
  // ============================================
  async logout(
    userId: string,
    sessionId: string,
  ) {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $pull: {
          activeSessions: {
            sessionId,
          },
        },
      },
    );

    return {
      success: true,

      message:
        'Session metadata flushed from MongoDB cluster pool.',
    };
  }
}
