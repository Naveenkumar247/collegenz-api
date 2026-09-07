import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FeaturedPost } from './schema/featured-post.schema';
import { CreateFeaturedPostDto } from './dto/create-featured-post.dto';

@Injectable()
export class FeaturedPostsService {
  constructor(
    @InjectModel(FeaturedPost.name)
    private readonly featuredPostModel: Model<FeaturedPost>,
  ) {}

  async create(
    createDto: CreateFeaturedPostDto,
    files?: any[],
  ) {
    const imageUrls =
      files?.map(
        (file) =>
          file.path ||
          file.secure_url ||
          `/uploads/${file.filename}`,
      ) || [];

    const createdPost = new this.featuredPostModel({
      postId: createDto.postId,
      description: createDto.description || '',
      priority: createDto.priority ?? 0,
      expiresAt: createDto.expiresAt
        ? new Date(createDto.expiresAt)
        : null,
      images: imageUrls,
    });

    return createdPost.save();
  }

  async findAll() {
    const now = new Date();

    return this.featuredPostModel
      .find({
        $or: [
          { expiresAt: null },
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: now } },
        ],
      })
      .populate('postId')
      .sort({
        priority: -1,
        createdAt: -1,
      })
      .lean()
      .exec();
  }

  async remove(id: string) {
    const deleted =
      await this.featuredPostModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException('Featured post not found');
    }

    return {
      success: true,
      message: 'Featured post removed successfully',
    };
  }
}
