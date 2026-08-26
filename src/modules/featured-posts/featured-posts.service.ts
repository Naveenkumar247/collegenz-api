import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FeaturedPost } from './schema/featured-post.schema';
import { CreateFeaturedPostDto } from './dto/create-featured-post.dto';

@Injectable()
export class FeaturedPostsService {
  constructor(
    @InjectModel(FeaturedPost.name)
    private featuredPostModel: Model<FeaturedPost>,
  ) {}

  async create(createDto: CreateFeaturedPostDto, files?: Express.Multer.File[]) {
    // If uploading direct images for featured posts:
    const imageUrls = files?.map((file: any) => file.path || `/uploads/${file.filename}`) || [];

    const createdPost = new this.featuredPostModel({
      ...createDto,
      ...(imageUrls.length > 0 && { images: imageUrls }),
    });

    return createdPost.save();
  }

  async findAll() {
    const now = new Date();

    return this.featuredPostModel
      .find({
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: now } } // Exclude expired featured posts
        ],
      })
      .populate({
        path: 'postId',
        populate: {
          path: 'author',
          select: 'name avatar username', // Populates nested author details from original post
        },
      })
      .sort({ priority: -1, createdAt: -1 }) // Sort by priority high -> low, then newest
      .exec();
  }

  async remove(id: string) {
    return this.featuredPostModel.findByIdAndDelete(id).exec();
  }
}
