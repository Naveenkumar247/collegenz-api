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

  // 🔴 1. TOGGLE LIKE: Updates Post Likes Array AND User LikedPosts Array
  async toggleLikePost(postId: string, userId: string): Promise<any> {
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);

    const post = await this.postModel.findById(postObjectId);
    if (!post) throw new NotFoundException('Target post not found');

    // Check if user already liked the post
    const hasLiked = post.likes.includes(userObjectId);

    if (hasLiked) {
      // Pull/Remove out of both target document matrices
      await this.postModel.updateOne({ _id: postObjectId }, { $pull: { likes: userObjectId } });
      await this.userModel.updateOne({ _id: userObjectId }, { $pull: { likedPosts: postObjectId } });
    } else {
      // Push/Add into both target document matrices
      await this.postModel.updateOne({ _id: postObjectId }, { $addToSet: { likes: userObjectId } });
      await this.userModel.updateOne({ _id: userObjectId }, { $addToSet: { likedPosts: postObjectId } });
    }

    // Return the freshly populated updated post data back to the Next.js client
    return this.getNormalizedPostForUser(postId, userId);
  }

  // 🔴 2. TOGGLE SAVE: Updates Post SavedBy Array AND User SavedPosts Array
  async toggleSavePost(postId: string, userId: string): Promise<any> {
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);

    const user = await this.userModel.findById(userObjectId);
    if (!user) throw new NotFoundException('User cluster parameters not found');

    const isSaved = user.savedPosts?.includes(postObjectId);

    if (isSaved) {
      await this.userModel.updateOne({ _id: userObjectId }, { $pull: { savedPosts: postObjectId } });
      await this.postModel.updateOne({ _id: postObjectId }, { $pull: { savedBy: userObjectId } });
    } else {
      await this.userModel.updateOne({ _id: userObjectId }, { $addToSet: { savedPosts: postObjectId } });
      await this.postModel.updateOne({ _id: postObjectId }, { $addToSet: { savedBy: userObjectId } });
    }

    return this.getNormalizedPostForUser(postId, userId);
  }

  // Helper utility to format data perfectly for your frontend PostCard layout parameters
  private async getNormalizedPostForUser(postId: string, userId: string) {
    const post = await this.postModel.findById(postId).populate('author', 'name picture').lean();
    const userObjId = new Types.ObjectId(userId);

    return {
      ...post,
      likesCount: post.likes?.length || 0,
      isLikedByCurrentUser: post.likes?.some(id => id.toString() === userId) || false,
      isSavedByCurrentUser: post.savedBy?.some(id => id.toString() === userId) || false,
    };
  }
}
