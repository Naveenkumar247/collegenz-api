import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '../users/schemas/post.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createPostDto: CreatePostDto, userId: string, email: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User profile not discovered');

    const newPost = await this.postModel.create({
      ...createPostDto,
      userId: new Types.ObjectId(userId),
      username: user.username,
      userEmail: email,
      picture: user.picture,
      college: user.college,
    });

    // Increment user post statistics tracker
    await this.userModel.findByIdAndUpdate(userId, { $inc: { postCount: 1 } });
    return newPost;
  }

  async getFeed(type: string, userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const matchQuery: any = { status: 'APPROVED' };

    if (type && type !== 'recent') {
      matchQuery.postType = type;
    }

    const currentUserId = new Types.ObjectId(userId);

    // Optimized Multi-Stage MongoDB Aggregation Pipeline
    return this.postModel.aggregate([
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $addFields: {
          hasLiked: { $in: [currentUserId, { $ifNull: ['$likedBy', []] }] },
          hasSaved: { $in: [currentUserId, { $ifNull: ['$savedBy', []] }] },
        },
      },
      {
        $project: {
          likedBy: 0,
          savedBy: 0,
          sharedBy: 0,
        },
      },
    ]);
  }

  async toggleLike(postId: string, userId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Target post not found');

    const uId = new Types.ObjectId(userId);
    const hasLiked = post.likedBy.some(id => id.equals(uId));

    if (hasLiked) {
      // Unlike post action
      await this.postModel.findByIdAndUpdate(postId, {
        $pull: { likedBy: uId },
        $inc: { likes: -1 },
      });
      await this.userModel.findByIdAndUpdate(post.userId, { $inc: { totalLikes: -1 } });
      return { liked: false };
    } else {
      // Like post action
      await this.postModel.findByIdAndUpdate(postId, {
        $addToSet: { likedBy: uId },
        $inc: { likes: 1 },
      });
      await this.userModel.findByIdAndUpdate(post.userId, { $inc: { totalLikes: 1 } });
      return { liked: true };
    }
  }

  async delete(postId: string, userId: string) {
    const post = await this.postModel.findOneAndDelete({
      _id: new Types.ObjectId(postId),
      userId: new Types.ObjectId(userId),
    });
    if (!post) throw new NotFoundException('Post not found or unauthorized deletion request');
    
    await this.userModel.findByIdAndUpdate(userId, { $inc: { postCount: -1 } });
    return { success: true, message: 'Post successfully eliminated' };
  }
}
