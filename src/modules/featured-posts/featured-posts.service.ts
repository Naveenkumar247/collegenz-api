import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FeaturedPost, FeaturedPostDocument } from './schema/featured-post.schema';
import { CreateFeaturedPostDto } from './dto/create-featured-post.dto';

@Injectable()
export class FeaturedPostsService {
  constructor(
    @InjectModel(FeaturedPost.name)
    private readonly featuredPostModel: Model<FeaturedPostDocument>,
  ) {}

  async create(createDto: CreateFeaturedPostDto): Promise<FeaturedPost> {
    const exists = await this.featuredPostModel.findOne({ postId: createDto.postId });
    if (exists) {
      throw new ConflictException('Post is already featured');
    }
    return this.featuredPostModel.create(createDto);
  }

  async findAll(): Promise<FeaturedPost[]> {
    return this.featuredPostModel
      .find()
      .populate('postId')
      .sort({ priority: -1, createdAt: -1 })
      .exec();
  }

  async remove(postId: string): Promise<FeaturedPost> {
    const deleted = await this.featuredPostModel.findOneAndDelete({ postId }).exec();
    if (!deleted) {
      throw new NotFoundException('Featured post entry not found');
    }
    return deleted;
  }
}
