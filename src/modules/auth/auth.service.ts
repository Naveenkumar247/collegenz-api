import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schema/user.schema';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: any, req: any) {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password credentials.');
    }

    // 🟢 Prevent Bcrypt crash if a Google OAuth user attempts standard password login
    if (!user.password) {
      throw new UnauthorizedException(
        'This account was created using Google Sign-In. Please sign in with Google.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password credentials.');
    }

    const currentSession = {
      sessionId: uuidv4(),
      deviceAgent: req?.headers?.['user-agent'] || 'Unknown Connection Agent',
      ipAddress: req?.ip || req?.connection?.remoteAddress || '127.0.0.1',
      loginTime: new Date(),
      lastActive: new Date(),
    };

    await this.userModel.updateOne(
      { _id: user._id },
      { $push: { activeSessions: currentSession } },
    );

    // 🟢 Convert MongoDB ObjectId to String for standard JWT payload formatting
    const userIdString = user._id.toString();
    const payload = {
      sub: userIdString,
      email: user.email,
      sessionId: currentSession.sessionId,
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: userIdString,
        name: user.name,
        email: user.email,
        username: user.username,
        picture: user.picture,
      },
    };
  }

  async validateGoogleUser(googleProfile: any) {
    // 🟢 Safely parse properties regardless of whether passed directly or via Passport strategy
    const email = googleProfile.email || googleProfile.emails?.[0]?.value;
    const name =
      googleProfile.name ||
      (googleProfile.firstName
        ? `${googleProfile.firstName} ${googleProfile.lastName || ''}`.trim()
        : googleProfile.displayName) ||
      'User';
    const picture =
      googleProfile.picture ||
      googleProfile.photos?.[0]?.value ||
      'https://collegenz.in/uploads/profilepic.jpg';

    if (!email) {
      throw new UnauthorizedException('No email address returned from Google OAuth payload.');
    }

    let user = await this.userModel.findOne({ email });

    if (!user) {
      const generatedUsername = `${email.split('@')[0]}_${Math.floor(
        1000 + Math.random() * 9000,
      )}`;

      user = await this.userModel.create({
        name,
        email,
        picture,
        googleUser: true,
        username: generatedUsername,
        activeSessions: [],
      });
    } else {
      // Keep profile picture updated if changed
      if (picture && user.picture !== picture) {
        user.picture = picture;
        await user.save();
      }
    }

    const currentSession = {
      sessionId: uuidv4(),
      deviceAgent: 'Google OAuth Handshake Stream',
      ipAddress: 'OAUTH_GATEWAY',
      loginTime: new Date(),
      lastActive: new Date(),
    };

    await this.userModel.updateOne(
      { _id: user._id },
      { $push: { activeSessions: currentSession } },
    );

    const userIdString = user._id.toString();
    const payload = {
      sub: userIdString,
      email: user.email,
      sessionId: currentSession.sessionId,
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: userIdString,
        name: user.name,
        email: user.email,
        username: user.username,
        picture: user.picture,
      },
    };
  }

  async logout(userId: string, sessionId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { activeSessions: { sessionId: sessionId } } },
    );
    return {
      success: true,
      message: 'Session metadata flushed from MongoDB cluster pool.',
    };
  }
}
