import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findOneById(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User profile not found in cluster registry.');
    }
    return user;
  }
}
