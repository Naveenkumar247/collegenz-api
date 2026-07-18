import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from './schema/post.schema';
import { User } from '../users/schema/user.schema';
import { Featured } from './schema/featured.schema';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Featured.name) private readonly featuredModel: Model<Featured>,
  ) {
    cloudinary.config({ 
      cloud_name: process.env.CLOUDINARY_NAME, 
      api_key: process.env.CLOUDINARY_KEY, 
      api_secret: process.env.CLOUDINARY_SECRET 
    });
  }

  // 🟢 FIXED: Removed Express.Multer strict typing
  async createPost(body: any, files: any[], userId: string) {
    const { post_type, data } = body;
    
    if (!post_type || !data) {
      throw new BadRequestException("Post type and content are required.");
    }

    const userObjectId = new Types.ObjectId(userId);
    const currentUser: any = await this.userModel.findById(userObjectId).lean();

    if (!currentUser) {
      throw new BadRequestException("User not found.");
    }

    let imageurls = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }).end(file.buffer);
        });
        imageurls.push((result as any).secure_url);
      }
    }

    const postData = {
      ...body,
      postType: post_type,
      userId: currentUser._id,
      username: currentUser.username,
      picture: currentUser.picture,
      imageurl: imageurls,
      status: "APPROVED",
      likes: 0,
      saves: 0,
      likedBy: [],
      savedBy: [],
      sharedBy: []
    };

    const newPost = new this.postModel(postData);
    await newPost.save();

    await this.userModel.findByIdAndUpdate(userObjectId, {
      $inc: { postCount: 1 }
    });

    return { success: true, message: "Post created successfully" };
  }

  private formatPost(post: any, userId: string, userSavedPosts: any[] = []) {
    const likesArray = Array.isArray(post.likedBy) ? post.likedBy : [];
    const savesArray = Array.isArray(post.savedBy) ? post.savedBy : [];

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
      likesCount: typeof post.likes === 'number' ? post.likes : likesArray.length,
      savesCount: typeof post.saves === 'number' ? post.saves : savesArray.length,
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
      await this.postModel.updateOne(
        { _id: postObjectId }, 
        { 
          $pull: { likedBy: userObjectId },
          $inc: { likes: -1 } 
        }
      );
      await this.userModel.updateOne({ _id: userObjectId }, { $pull: { likedPosts: postObjectId } });
    } else {
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
      await this.postModel.updateOne(
        { _id: postObjectId }, 
        { 
          $pull: { savedBy: userObjectId },
          $inc: { saves: -1 }
        }
      );
      await this.userModel.updateOne({ _id: userObjectId }, { $pull: { savedPosts: postObjectId } });
    } else {
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

  // 🟢 NEW: Dedicated toggle for saving events
  async toggleSaveEvent(postId: string, userId: string): Promise<any> {
    if (!postId || !userId) throw new NotFoundException('Invalid arguments');
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);

    const post: any = await this.postModel.findById(postObjectId);
    if (!post) throw new NotFoundException('Post not found');

    // Strict enforcement: Ensure the post is actually an event
    if (post.postType !== 'event') {
      throw new BadRequestException('Only events can be saved to your events calendar.');
    }

    const user: any = await this.userModel.findById(userObjectId);
    if (!user) throw new NotFoundException('User not found');

    const savedEventsArray = Array.isArray(user.savedEvents) ? user.savedEvents : [];
    const isSaved = savedEventsArray.some((id: any) => id.toString() === postObjectId.toString());

    if (isSaved) {
      await this.userModel.updateOne(
        { _id: userObjectId },
        { $pull: { savedEvents: postObjectId } }
      );
      return { message: 'Event removed from saved list', isSaved: false };
    } else {
      await this.userModel.updateOne(
        { _id: userObjectId },
        { $addToSet: { savedEvents: postObjectId } }
      );
      return { message: 'Event saved successfully', isSaved: true };
    }
  }

  // 🟢 NEW: Retrieve all saved events for a user
  async getSavedEvents(userId: string): Promise<any[]> {
    if (!userId) throw new BadRequestException('User ID is required');
    const userObjectId = new Types.ObjectId(userId);

    const user: any = await this.userModel.findById(userObjectId)
      .populate({
        path: 'savedEvents',
        match: { postType: 'event' }, // Fallback filter during population
        options: { sort: { createdAt: -1 } }
      })
      .lean();

    if (!user || !user.savedEvents) {
      return [];
    }

    // Return the formatted posts
    return user.savedEvents.map((event: any) => this.formatPost(event, userId));
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
