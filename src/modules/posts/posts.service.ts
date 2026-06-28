import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from './schema/post.schema';
import { User } from '../users/schema/user.schema';
import { Featured } from './schema/featured.schema';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Featured.name) private readonly featuredModel: Model<Featured>,
  ) {}

  // 🟢 UNIVERSAL FORMATTER: Ensures all routes format images, likes, and saves perfectly
  private formatPost(post: any, userId: string, userSavedPosts: any[] = []) {
    // 1. Safely extract arrays (fallback to empty array if missing)
    const likesArray = Array.isArray(post.likedBy) ? post.likedBy : [];
    const savesArray = Array.isArray(post.savedBy) ? post.savedBy : [];

    // 2. Safely resolve images from your specific database fields
    const resolvedImages = (Array.isArray(post.images) && post.images.length > 0) 
      ? post.images 
      : (post.imageurl ? [post.imageurl] : (post.imageUrl ? [post.imageUrl] : (post.image ? [post.image] : [])));

    return {
      ...post,
      content: post.caption || post.content || post.text || (post.data ? String(post.data) : ''),
      images: resolvedImages,
      author: {
        name: post.username || post.author?.name || post.author?.username || 'Anonymous User',
        picture: post.picture || post.avatar || post.author?.picture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'
      },
      // 3. Fallback to calculating the array length if the number field gets out of sync
      likesCount: typeof post.likes === 'number' ? post.likes : likesArray.length,
      savesCount: typeof post.saves === 'number' ? post.saves : savesArray.length,
      
      // 4. Determine if the current user has interacted with this post
      isLikedByCurrentUser: userId ? likesArray.some((id: any) => id.toString() === userId.toString()) : false,
      isSavedByCurrentUser: userId ? (savesArray.some((id: any) => id.toString() === userId.toString()) || 
                            userSavedPosts.some((id: any) => id.toString() === post._id.toString())) : false,
    };
  }

  async getFeed(type: string, userId: string, pageNum: number): Promise<any[]> {
    const limit = 10;
    const skip = (pageNum - 1) * limit;

    try {
      const rawPosts = await this.postModel
        .find()
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      let userSavedPosts: any[] = [];
      if (userId && Types.ObjectId.isValid(userId)) {
        const user: any = await this.userModel.findById(userId).lean();
        if (user && Array.isArray(user.savedPosts)) {
          userSavedPosts = user.savedPosts;
        }
      }

      return rawPosts.map((post: any) => this.formatPost(post, userId, userSavedPosts));
    } catch (error) {
      console.error('🚨 Crash caught inside getFeed service:', error);
      return [];
    }
  }

  async getFeatured(): Promise<any[]> {
    try {
      const rawFeatured = await this.featuredModel
        .find()
        .sort({ _id: -1 })
        .limit(5)
        .lean();

      if (!rawFeatured || rawFeatured.length === 0) {
        return [];
      }

      return rawFeatured.map((feat: any) => ({
        ...feat,
        content: feat.data || feat.caption || '', 
        images: Array.isArray(feat.imageurl) && feat.imageurl.length > 0 ? feat.imageurl : (feat.imageurl ? [feat.imageurl] : []), 
        author: {
          name: feat.username || 'Anonymous User',
          picture: feat.picture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'
        }
      }));
    } catch (error) {
      console.error('🚨 Failed to fetch featured posts:', error);
      return [];
    }
  }

  async toggleLikePost(postId: string, userId: string): Promise<any> {
    if (!postId || !userId) throw new NotFoundException('Invalid arguments');
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);

    const post: any = await this.postModel.findById(postObjectId);
    if (!post) throw new NotFoundException('Post not found');

    const likesArray = Array.isArray(post.likedBy) ? post.likedBy : [];
    const hasLiked = likesArray.some((id: any) => id.toString() === userObjectId.toString());

    if (hasLiked) {
      // 🟢 User un-likes: Pull ID from array and subtract 1 from count
      await this.postModel.updateOne(
        { _id: postObjectId }, 
        { 
          $pull: { likedBy: userObjectId },
          $inc: { likes: -1 } 
        }
      );
      await this.userModel.updateOne({ _id: userObjectId }, { $pull: { likedPosts: postObjectId } });
    } else {
      // 🟢 User likes: Add ID to array and add 1 to count
      await this.postModel.updateOne(
        { _id: postObjectId }, 
        { 
          $addToSet: { likedBy: userObjectId },
          $inc: { likes: 1 }
        }
      );
      await this.userModel.updateOne({ _id: userObjectId }, { $addToSet: { likedPosts: postObjectId } });
    }
    
    return this.getNormalizedPostForUser(postId, userId);
  }

  async toggleSavePost(postId: string, userId: string): Promise<any> {
    if (!postId || !userId) throw new NotFoundException('Invalid arguments');
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);

    const post: any = await this.postModel.findById(postObjectId);
    if (!post) throw new NotFoundException('Post not found');

    const savesArray = Array.isArray(post.savedBy) ? post.savedBy : [];
    const isSaved = savesArray.some((id: any) => id.toString() === userObjectId.toString());

    if (isSaved) {
      // 🟢 User un-saves
      await this.postModel.updateOne(
        { _id: postObjectId }, 
        { 
          $pull: { savedBy: userObjectId },
          $inc: { saves: -1 }
        }
      );
      await this.userModel.updateOne({ _id: userObjectId }, { $pull: { savedPosts: postObjectId } });
    } else {
      // 🟢 User saves
      await this.postModel.updateOne(
        { _id: postObjectId }, 
        { 
          $addToSet: { savedBy: userObjectId },
          $inc: { saves: 1 }
        }
      );
      await this.userModel.updateOne({ _id: userObjectId }, { $addToSet: { savedPosts: postObjectId } });
    }
    
    return this.getNormalizedPostForUser(postId, userId);
  }

  async trackSharePost(postId: string, userId: string): Promise<any> {
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = userId ? new Types.ObjectId(userId) : new Types.ObjectId();
    
    // We can assume share tracking is just appending an ID to an array
    await this.postModel.updateOne({ _id: postObjectId }, { $addToSet: { sharedBy: userObjectId } });
    
    return this.getNormalizedPostForUser(postId, userId || '');
  }

  private async getNormalizedPostForUser(postId: string, userId: string) {
    const post: any = await this.postModel.findById(postId).lean();
    if (!post) throw new NotFoundException('Post not found');

    let userSavedPosts: any[] = [];
    if (userId && Types.ObjectId.isValid(userId)) {
      const user: any = await this.userModel.findById(userId).lean();
      if (user && Array.isArray(user.savedPosts)) {
        userSavedPosts = user.savedPosts;
      }
    }

    return this.formatPost(post, userId, userSavedPosts);
  }
}
