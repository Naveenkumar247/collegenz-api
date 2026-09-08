import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FeaturedPost } from './schema/featured-post.schema';
import { CreateFeaturedPostDto } from './dto/create-featured-post.dto';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class FeaturedPostsService {
  constructor(
    @InjectModel(FeaturedPost.name)
    private readonly featuredPostModel: Model<FeaturedPost>,
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_KEY,
      api_secret: process.env.CLOUDINARY_SECRET,
    });
  }

  /**
   * Upload an image to Cloudinary
   */
  private async uploadToCloudinary(
    file: any,
  ): Promise<string> {
    if (!file?.buffer) {
      throw new BadRequestException(
        'Invalid image file received.',
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'collegenz/featured-posts',
          },
          (error, result) => {
            if (error) {
              console.error(
                'Cloudinary featured image upload failed:',
                error,
              );

              reject(
                new BadRequestException(
                  'Failed to upload featured image.',
                ),
              );

              return;
            }

            if (!result?.secure_url) {
              reject(
                new BadRequestException(
                  'Cloudinary did not return an image URL.',
                ),
              );

              return;
            }

            resolve(result.secure_url);
          },
        );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Create an independent featured post
   */
  async create(
    createDto: CreateFeaturedPostDto,
    files?: any[],
  ) {
    if (!createDto.title?.trim()) {
      throw new BadRequestException(
        'Title is required.',
      );
    }

    const imageUrls: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const secureUrl =
          await this.uploadToCloudinary(file);

        imageUrls.push(secureUrl);
      }
    }

    const createdPost =
      new this.featuredPostModel({
        title: createDto.title.trim(),

        description:
          createDto.description?.trim() || '',

        priority:
          createDto.priority ?? 0,

        expiresAt:
          createDto.expiresAt
            ? new Date(createDto.expiresAt)
            : null,

        images: imageUrls,
      });

    const savedPost =
      await createdPost.save();

    return {
      success: true,
      message:
        'Featured post created successfully.',
      featuredPost: savedPost,
    };
  }

  /**
   * Get active featured posts
   */
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
      .sort({
        priority: -1,
        createdAt: -1,
      })
      .lean()
      .exec();
  }

  /**
   * Remove / unfeature
   */
  async remove(id: string) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'Invalid featured post ID.',
      );
    }

    const deleted =
      await this.featuredPostModel
        .findByIdAndDelete(id)
        .exec();

    if (!deleted) {
      throw new NotFoundException(
        'Featured post not found.',
      );
    }

    return {
      success: true,
      message:
        'Featured post removed successfully.',
    };
  }
}
