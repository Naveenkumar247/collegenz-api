import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, name, password } = registerDto;
    
    const userExists = await this.userModel.findOne({ email });
    if (userExists) {
      throw new ConflictException('Email address already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const createdUser = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
      username: email.split('@')[0] + Math.floor(Math.random() * 1000),
    });

    return this.generateUserToken(createdUser);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials matching records');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials matching records');
    }

    return this.generateUserToken(user);
  }

  /**
   * Validates an existing Google user or seamlessly spins up a new account 
   * directly using the unified database model pool.
   */
  async validateGoogleUser(googleProfile: any) {
    // Gracefully handle both strategy profile payloads structures
    const email = googleProfile.email || googleProfile.emails?.[0]?.value;
    const name = googleProfile.name || `${googleProfile.firstName || ''} ${googleProfile.lastName || ''}`.trim();
    const picture = googleProfile.picture || googleProfile.photos?.[0]?.value;

    let user = await this.userModel.findOne({ email });
    
    if (!user) {
      user = await this.userModel.create({
        name: name || email.split('@')[0],
        email,
        picture,
        googleUser: true,
        isVerified: true, // Google emails are pre-verified
        username: email.split('@')[0] + Math.floor(Math.random() * 9000 + 1000),
      });
    }

    return this.generateUserToken(user);
  }

  private generateUserToken(user: UserDocument) {
    const payload = { sub: user._id, email: user.email, zrole: user.zrole };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        zrole: user.zrole,
        picture: user.picture,
      },
    };
  }
}
