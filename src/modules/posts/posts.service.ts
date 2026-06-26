import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from './schema/post.schema';
import { User } from '../users/schema/user.schema';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  // 🟢 FIXED: Resolves Controller line 57 'getFeed' requirement
  async getFeed(type: string, userId: string, pageNum: number): Promise<any[]> {
    const limit = 10;
    const skip = (pageNum - 1) * limit;

    const rawPosts = await this.postModel
      .find()
      .populate('userId', 'name picture') // Adjust field name if your reference is different
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return rawPosts.map((post: any) => ({
      ...post,
      likesCount: post.likes?.length || 0,
      isLikedByCurrentUser: post.likes?.some((id: any) => id.toString() === userId) || false,
      isSavedByCurrentUser: post.savedBy?.some((id: any) => id.toString() === userId) || false,
    }));
  }

  // 🟢 FIXED: Resolves Controller line 50 'getFeatured' requirement
  async getFeatured(): Promise<any[]> {
    return this.postModel.find({ postType: 'featured' }).limit(5).lean();
  }

  // 🟢 TOGGLE LIKE: Updates Post 'likes' AND User 'likedPosts'
  async toggleLikePost(postId: string, userId: string): Promise<any> {
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);

    const post = await this.postModel.findById(postObjectId);
    if (!post) throw new NotFoundException('Target post not found');

    const hasLiked = post.likes?.some((id: any) => id.toString() === userId);

    if (hasLiked) {
      await this.postModel.updateOne({ _id: postObjectId }, { $pull: { likes: userObjectId } });
      await this.userModel.updateOne({ _id: userObjectId }, { $pull: { likedPosts: postObjectId } });
    } else {
      await this.postModel.updateOne({ _id: postObjectId }, { $addToSet: { likes: userObjectId } });
      await this.userModel.updateOne({ _id: userObjectId }, { $addToSet: { likedPosts: postObjectId } });
    }

    return this.getNormalizedPostForUser(postId, userId);
  }

  // 🟢 TOGGLE SAVE: Updates Post 'savedBy' AND User 'savedPosts'
  async toggleSavePost(postId: string, userId: string): Promise<any> {
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);

    const post = await this.postModel.findById(postObjectId);
    if (!post) throw new NotFoundException('Target post not found');

    const isSaved = post.savedBy?.some((id: any) => id.toString() === userId);

    if (isSaved) {
      await this.postModel.updateOne({ _id: postObjectId }, { $pull: { savedBy: userObjectId } });
      await this.userModel.updateOne({ _id: userObjectId }, { $pull: { savedPosts: postObjectId } });
    } else {
      await this.postModel.updateOne({ _id: postObjectId }, { $addToSet: { savedBy: userObjectId } });
      await this.userModel.updateOne({ _id: userObjectId }, { $addToSet: { savedPosts: postObjectId } });
    }

    return this.getNormalizedPostForUser(postId, userId);
  }

  private async getNormalizedPostForUser(postId: string, userId: string) {
    const post: any = await this.postModel.findById(postId).lean();
    if (!post) throw new NotFoundException('Post not found');

    return {
      ...post,
      likesCount: post.likes?.length || 0,
      isLikedByCurrentUser: post.likes?.some((id: any) => id.toString() === userId) || false,
      isSavedByCurrentUser: post.savedBy?.some((id: any) => id.toString() === userId) || false,
    };
  }
}
