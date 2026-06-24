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

  async validateOrCreateGoogleUser(googleProfile: any) {
    const { email, name, picture } = googleProfile;
    
    let user = await this.userModel.findOne({ email });
    if (!user) {
      user = await this.userModel.create({
        name,
        email,
        picture,
        googleUser: true,
        username: email.split('@')[0] + Math.floor(Math.random() * 1000),
      });
    }

    return this.generateUserToken(user);
  }

  // Add this method inside your existing AuthService class:
async validateGoogleUser(googleUser: any) {
  // Check if user already exists in MongoDB
  let user = await this.usersService.findByEmail(googleUser.email);

  if (!user) {
    // If not found, register them automatically
    user = await this.usersService.create({
      email: googleUser.email,
      username: `${googleUser.firstName.toLowerCase()}${Math.floor(1000 + Math.random() * 9000)}`,
      picture: googleUser.picture,
      isVerified: true, // Google emails are already pre-verified
    });
  }

  // Generate your system JWT login token payload
  const payload = { sub: user._id, email: user.email };
  return {
    accessToken: this.jwtService.sign(payload),
  };
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
