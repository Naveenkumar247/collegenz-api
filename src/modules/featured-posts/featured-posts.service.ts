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

  async create(createDto: CreateFeaturedPostDto, files?: any[]) {
    const imageUrls = files?.map((file) => file.path || `/uploads/${file.filename}`) || [];

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
          { expiresAt: { $gt: now } },
        ],
      })
      .populate({
        path: 'postId',
        populate: {
          path: 'author',
          select: 'name avatar username',
        },
      })
      .sort({ priority: -1, createdAt: -1 })
      .exec();
  }

  async remove(id: string) {
    return this.featuredPostModel.findByIdAndDelete(id).exec();
  }
}
