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

  async getFeed(type: string, userId: string, pageNum: number): Promise<any[]> {
    const limit = 10;
    const skip = (pageNum - 1) * limit;

    try {
      console.log(`📡 getFeed hit for User: ${userId || 'Guest'}`);

      const rawPosts = await this.postModel
        .find()
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      console.log(`📦 Found raw documents count: ${rawPosts.length}`);

      // Safely fetch user fallback if userId exists
      let userSavedPosts: any[] = [];
      if (userId && Types.ObjectId.isValid(userId)) {
        const user: any = await this.userModel.findById(userId).lean();
        if (user && Array.isArray(user.savedPosts)) {
          userSavedPosts = user.savedPosts;
        }
      }

      return rawPosts.map((post: any) => {
        // 🟢 SAFELY PARSE EVERY SINGLE PROPERTY TO PREVENT 500 CRASHES
        const likesArray = Array.isArray(post.likes) ? post.likes : 
                           (Array.isArray(post.likedBy) ? post.likedBy : []);
        
        const savesArray = Array.isArray(post.savedBy) ? post.savedBy : [];
        const sharesArray = Array.isArray(post.sharedBy) ? post.sharedBy : [];

        // Dynamic content mapping based on what your collection actually holds
        const postContent = post.content || post.caption || post.text || 
                            (post.data ? String(post.data) : '');

        // Handle image carousel array vs single string fields gracefully
        let imagesList: string[] = [];
        if (Array.isArray(post.images)) {
          imagesList = post.images;
        } else if (post.imageUrl || post.image || post.postMedia) {
          imagesList = [post.imageUrl || post.image || post.postMedia];
        }

        return {
          ...post,
          content: postContent,
          images: imagesList,
          author: {
            name: post.username || 'Anonymous User',
            picture: post.avatar || 'https://collegenz.in/uploads/profilepic.jpg'
          },
          likesCount: likesArray.length,
          savesCount: savesArray.length,
          sharesCount: sharesArray.length,
          isLikedByCurrentUser: userId ? likesArray.some((id: any) => id.toString() === userId.toString()) : false,
          isSavedByCurrentUser: userId ? (savesArray.some((id: any) => id.toString() === userId.toString()) || 
                                userSavedPosts.some((id: any) => id.toString() === post._id.toString())) : false,
        };
      });
    } catch (error) {
      console.error('🚨 Crash caught inside getFeed service:', error);
      // Fallback return so the frontend at least gets an empty array instead of a 500 error page
      return [];
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
    const hasLiked = likesArray.some((id: any) => id.toString() === userId.toString());

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
    const isSaved = savesArray.some((id: any) => id.toString() === userId.toString());

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
