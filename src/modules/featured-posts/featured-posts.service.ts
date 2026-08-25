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
    // Process uploaded file buffers/URLs here if present
    const createdPost = new this.featuredPostModel({
      ...createDto,
    });
    return createdPost.save();
  }

  async findAll() {
    return this.featuredPostModel.find().exec();
  }

  async remove(id: string) {
    return this.featuredPostModel.findByIdAndDelete(id).exec();
  }
}
