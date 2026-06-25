import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../posts/schema/user.schema';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  // 🟢 SECURE LOGIN: Validates credentials and appends session tokens directly into MongoDB
  async login(loginDto: any, req: any) {
    const { email, password } = loginDto;

    // 1. Find the target account entity profile inside MongoDB
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password credentials.');
    }

    // 2. Validate hash signature bounds
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password credentials.');
    }

    // 3. Assemble unique metadata handshake values for this session
    const currentSession = {
      sessionId: uuidv4(),
      deviceAgent: req.headers['user-agent'] || 'Unknown Connection Agent',
      ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      loginTime: new Date(),
      lastActive: new Date(),
    };

    // 4. ATOMIC UPDATE: Append the activeSession meta map block inside the database cluster
    await this.userModel.updateOne(
      { _id: user._id },
      { 
        $push: { activeSessions: currentSession } 
      }
    );

    // 5. Sign the payload (including context for tracking session revocation later)
    const payload = { 
      userId: user._id, 
      email: user.email,
      sessionId: currentSession.sessionId 
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        picture: user.picture,
      },
    };
  }

  // 🟢 SECURE LOGOUT: Destroys and cleans the target session entry out of the MongoDB array block
  async logout(userId: string, sessionId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $pull: { activeSessions: { sessionId: sessionId } },
      },
    );
    return { success: true, message: 'Session metadata flushed from MongoDB cluster pool.' };
  }
}
