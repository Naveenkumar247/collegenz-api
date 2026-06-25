import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schema/user.schema';// 🟢 Adjusted safe module mapping path location
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  // Standard email/password credential login
  async login(loginDto: any, req: any) {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password credentials.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password credentials.');
    }

    const currentSession = {
      sessionId: uuidv4(),
      deviceAgent: req.headers['user-agent'] || 'Unknown Connection Agent',
      ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      loginTime: new Date(),
      lastActive: new Date(),
    };

    await this.userModel.updateOne(
      { _id: user._id },
      { $push: { activeSessions: currentSession } }
    );

    const payload = { userId: user._id, email: user.email, sessionId: currentSession.sessionId };

    return {
      token: this.jwtService.sign(payload),
      user: { id: user._id, name: user.name, email: user.email, username: user.username, picture: user.picture },
    };
  }

  // 🟢 FIXED: Re-implemented Google Passport validation target method matching your controller line 26
  async validateGoogleUser(googleProfile: any) {
    const { email, name, picture } = googleProfile;
    
    let user = await this.userModel.findOne({ email });
    
    if (!user) {
      // Form new database doc layout if entry is missing
      const result = await this.userModel.create({
        name,
        email,
        picture: picture || 'https://collegenz.in/uploads/profilepic.jpg',
        googleUser: true,
        username: email.split('@')[0] + Math.floor(Math.random() * 1000),
        activeSessions: []
      });
      user = result as any;
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
      { $push: { activeSessions: currentSession } }
    );

    const payload = { userId: user._id, email: user.email, sessionId: currentSession.sessionId };

    return {
      token: this.jwtService.sign(payload),
      user: { id: user._id, name: user.name, email: user.email, username: user.username, picture: user.picture }
    };
  }

  async logout(userId: string, sessionId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { activeSessions: { sessionId: sessionId } } },
    );
    return { success: true, message: 'Session metadata flushed from MongoDB cluster pool.' };
  }
}
