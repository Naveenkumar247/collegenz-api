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

  async getFeed(type: string, userId: string, pageNum: number): Promise<any> {
    try {
      const skip = (pageNum - 1) * 10;
      
      // 1. Fetch raw data directly, absolutely no formatting loops
      const rawPosts = await this.postModel
        .find()
        .sort({ _id: -1 })
        .skip(skip || 0)
        .limit(10)
        .lean();

      // 2. If it is genuinely empty, tell us exactly WHY
      if (!rawPosts || rawPosts.length === 0) {
        return {
          ALERT: "DATABASE IS CONNECTED BUT EMPTY",
          reason: "Mongoose is looking at the 'posts' collection, but found 0 documents.",
          fix: "Check your MONGODB_URI in your Render Dashboard Environment Variables. Make sure you included the database name before the question mark! (e.g., mongodb+srv://...cluster.mongodb.net/YOUR_DB_NAME?retryWrites...)"
        };
      }

      // 3. If data exists, return it exactly like your second screenshot!
      return rawPosts;

    } catch (error) {
      // 4. If the database query crashes, print the actual crash to the screen!
      return { 
        ALERT: "BACKEND CRASH", 
        message: error.message 
      };
    }
  }
  

  async getFeatured(): Promise<any[]> {
    try {
      const featured = await this.postModel.find({ postType: 'featured' }).limit(5).lean();
      if (featured.length > 0) return featured;
      return this.postModel.find().limit(4).lean();
    } catch {
      return [];
    }
  }

  async toggleLikePost(postId: string, userId: string): Promise<any> {
    if (!postId || !userId) throw new NotFoundException('Invalid arguments');
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);

    const post: any = await this.postModel.findById(postObjectId);
    if (!post) throw new NotFoundException('Post not found');

    const likesArray = Array.isArray(post.likes) ? post.likes : [];
    const hasLiked = likesArray.some((id: any) => id.toString() === userObjectId.toString());

    if (hasLiked) {
      await this.postModel.updateOne({ _id: postObjectId }, { $pull: { likes: userObjectId, likedBy: userObjectId } });
      await this.userModel.updateOne({ _id: userObjectId }, { $pull: { likedPosts: postObjectId } });
    } else {
      await this.postModel.updateOne({ _id: postObjectId }, { $addToSet: { likes: userObjectId, likedBy: userObjectId } });
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
      await this.postModel.updateOne({ _id: postObjectId }, { $pull: { savedBy: userObjectId } });
      await this.userModel.updateOne({ _id: userObjectId }, { $pull: { savedPosts: postObjectId } });
    } else {
      await this.postModel.updateOne({ _id: postObjectId }, { $addToSet: { savedBy: userObjectId } });
      await this.userModel.updateOne({ _id: userObjectId }, { $addToSet: { savedPosts: postObjectId } });
    }
    return this.getNormalizedPostForUser(postId, userId);
  }

  async trackSharePost(postId: string, userId: string): Promise<any> {
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = userId ? new Types.ObjectId(userId) : new Types.ObjectId();
    await this.postModel.updateOne({ _id: postObjectId }, { $addToSet: { sharedBy: userObjectId } });
    return this.getNormalizedPostForUser(postId, userId || '');
  }

  private async getNormalizedPostForUser(postId: string, userId: string) {
    const post: any = await this.postModel.findById(postId).lean();
    if (!post) throw new NotFoundException('Post not found');

    const likesArray = Array.isArray(post.likes) ? post.likes : (Array.isArray(post.likedBy) ? post.likedBy : []);
    const savesArray = Array.isArray(post.savedBy) ? post.savedBy : [];

    return {
      ...post,
      content: post.content || post.caption || post.text || (post.data ? String(post.data) : ''),
      images: Array.isArray(post.images) ? post.images : (post.imageUrl ? [post.imageUrl] : []),
      likesCount: likesArray.length,
      savesCount: savesArray.length,
      isLikedByCurrentUser: userId ? likesArray.some((id: any) => id.toString() === userId.toString()) : false,
      isSavedByCurrentUser: userId ? savesArray.some((id: any) => id.toString() === userId.toString()) : false,
    };
  }
}
