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
   * Upload image buffer to Cloudinary
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
   * Create Featured Post
   */
  async create(
    createDto: CreateFeaturedPostDto,
    files?: any[],
  ) {
    /*
     * Validate Post ID
     */
    if (
      !createDto.postId ||
      !Types.ObjectId.isValid(createDto.postId)
    ) {
      throw new BadRequestException(
        'Invalid postId.',
      );
    }

    /*
     * Prevent the same post from being featured twice
     */
    const existing =
      await this.featuredPostModel.findOne({
        postId: new Types.ObjectId(
          createDto.postId,
        ),
      });

    if (existing) {
      throw new BadRequestException(
        'This post is already featured.',
      );
    }

    /*
     * Upload selected images to Cloudinary
     */
    const imageUrls: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const secureUrl =
          await this.uploadToCloudinary(file);

        imageUrls.push(secureUrl);
      }
    }

    /*
     * Create FeaturedPost document
     */
    const createdPost =
      new this.featuredPostModel({
        postId: new Types.ObjectId(
          createDto.postId,
        ),

        description:
          createDto.description || '',

        priority:
          createDto.priority ?? 0,

        expiresAt:
          createDto.expiresAt
            ? new Date(
                createDto.expiresAt,
              )
            : null,

        images: imageUrls,
      });

    const savedPost =
      await createdPost.save();

    /*
     * Return useful response
     */
    return {
      success: true,
      message:
        'Featured post created successfully.',
      featuredPost: savedPost,
    };
  }

  /**
   * Get all active Featured Posts
   */
  async findAll() {
    const now = new Date();

    return this.featuredPostModel
      .find({
        $or: [
          {
            expiresAt: null,
          },
          {
            expiresAt: {
              $exists: false,
            },
          },
          {
            expiresAt: {
              $gt: now,
            },
          },
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

  /**
   * Remove Featured Post
   */
  async remove(id: string) {
    if (
      !id ||
      !Types.ObjectId.isValid(id)
    ) {
      throw new BadRequestException(
        'Invalid featured post ID.',
      );
    }

    const deleted =
      await this.featuredPostModel.findByIdAndDelete(
        id,
      );

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
