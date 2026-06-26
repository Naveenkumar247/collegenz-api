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

    // 🟢 Finds EVERYTHING without strict property filters to guarantee documents show up
    const rawPosts = await this.postModel
      .find()
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const user: any = await this.userModel.findById(userId).lean();

    return rawPosts.map((post: any) => {
      // 🟢 Handles both 'likedBy' (from your raw data) or 'likes' safely
      const rawLikes = post.likedBy || post.likes || [];
      const likesArray = Array.isArray(rawLikes) ? rawLikes : [];
      
      const rawSaves = post.savedBy || [];
      const savesArray = Array.isArray(rawSaves) ? rawSaves : [];

      const rawShares = post.sharedBy || [];
      const sharesArray = Array.isArray(rawShares) ? rawShares : [];

      return {
        ...post,
        // Map data keys to what your PostCard front-end expects
        content: post.content || post.caption || post.text || (post.data ? String(post.data) : ''),
        images: Array.isArray(post.images) ? post.images : (post.imageUrl ? [post.imageUrl] : []),
        author: {
          name: post.username || 'Anonymous User',
          picture: 'https://collegenz.in/uploads/profilepic.jpg'
        },
        likesCount: likesArray.length,
        savesCount: savesArray.length,
        sharesCount: sharesArray.length,
        isLikedByCurrentUser: likesArray.some((id: any) => id.toString() === userId),
        isSavedByCurrentUser: savesArray.some((id: any) => id.toString() === userId) || 
                              (user?.savedPosts?.some((id: any) => id.toString() === post._id.toString()) || false)
      };
    });
  }

  async getFeatured(): Promise<any[]> {
    // Falls back to regular posts if you don't have explicit 'featured' postType entries yet
    const featured = await this.postModel.find({ postType: 'featured' }).limit(5).lean();
    if (featured.length > 0) return featured;
    
    return this.postModel.find().limit(4).lean();
  }

  async toggleLikePost(postId: string, userId: string): Promise<any> {
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);
    const post: any = await this.postModel.findById(postObjectId);
    if (!post) throw new NotFoundException('Post not found');

    const likesArray = Array.isArray(post.likes) ? post.likes : [];
    const hasLiked = likesArray.some((id: any) => id.toString() === userId);

    if (hasLiked) {
      // 🟢 FIXED: Combined into a single atomic $pull block object
      await this.postModel.updateOne(
        { _id: postObjectId }, 
        { $pull: { likes: userObjectId, likedBy: userObjectId } }
      );
      await this.userModel.updateOne({ _id: userObjectId }, { $pull: { likedPosts: postObjectId } });
    } else {
      // 🟢 FIXED: Combined into a single atomic $addToSet block object (Clears TS1117)
      await this.postModel.updateOne(
        { _id: postObjectId }, 
        { $addToSet: { likes: userObjectId, likedBy: userObjectId } }
      );
      await this.userModel.updateOne({ _id: userObjectId }, { $addToSet: { likedPosts: postObjectId } });
    }
    return this.getNormalizedPostForUser(postId, userId);
  }
  

  async toggleSavePost(postId: string, userId: string): Promise<any> {
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);
    const post: any = await this.postModel.findById(postObjectId);
    if (!post) throw new NotFoundException('Post not found');

    const savesArray = Array.isArray(post.savedBy) ? post.savedBy : [];
    const isSaved = savesArray.some((id: any) => id.toString() === userId);

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
    const userObjectId = new Types.ObjectId(userId || new Types.ObjectId());
    await this.postModel.updateOne({ _id: postObjectId }, { $addToSet: { sharedBy: userObjectId } });
    return this.getNormalizedPostForUser(postId, userId);
  }

  private async getNormalizedPostForUser(postId: string, userId: string) {
    const post: any = await this.postModel.findById(postId).lean();
    if (!post) throw new NotFoundException('Post not found');
    const user: any = await this.userModel.findById(userId).lean();

    const likesArray = Array.isArray(post.likes) ? post.likes : (Array.isArray(post.likedBy) ? post.likedBy : []);
    const savesArray = Array.isArray(post.savedBy) ? post.savedBy : [];

    return {
      ...post,
      content: post.content || post.caption || post.text || (post.data ? String(post.data) : ''),
      images: Array.isArray(post.images) ? post.images : (post.imageUrl ? [post.imageUrl] : []),
      likesCount: likesArray.length,
      savesCount: savesArray.length,
      isLikedByCurrentUser: likesArray.some((id: any) => id.toString() === userId),
      isSavedByCurrentUser: savesArray.some((id: any) => id.toString() === userId) || 
                            (user?.savedPosts?.some((id: any) => id.toString() === postId) || false)
    };
  }
  }
    
