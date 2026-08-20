import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  UnauthorizedException 
} from '@nestjs/common';
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

  // 🛠️ Helper: Enforce valid user ObjectId
  private requireAuthUser(userId?: string): Types.ObjectId {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedException('You must be signed in to perform this action.');
    }
    return new Types.ObjectId(userId);
  }

  // 🛠️ Helper: Robust post formatter with field unpacking & user population support
  private formatPost(post: any, userId?: string, userSavedPosts: any[] = []) {
    if (!post) return null;

    const likesArray = Array.isArray(post.likedBy) ? post.likedBy : [];
    const savesArray = Array.isArray(post.savedBy) ? post.savedBy : [];

    // 1. Resolve Author from populated userId, author object, or root fields
    const userObj = (post.userId && typeof post.userId === 'object') ? post.userId : 
                    ((post.author && typeof post.author === 'object') ? post.author : {});
                     
    const authorName = post.username || userObj.username || userObj.name || userObj.fullName || post.author?.name || 'CollegenZ User';
    const authorPicture = post.picture || post.avatar || userObj.picture || userObj.avatar || userObj.profilePicture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback';
    const authorCollege = userObj.college || post.college || 'CollegenZ Member';

    // 2. Resolve Content across all common Mongo schema formats (string or nested object)
    let extractedContent = post.content || post.caption || post.text || post.description || post.title || post.body || '';
    if (!extractedContent && post.data) {
      if (typeof post.data === 'string') {
        extractedContent = post.data;
      } else if (typeof post.data === 'object') {
        extractedContent = post.data.text || post.data.content || post.data.caption || post.data.description || post.data.title || post.data.body || '';
      }
    }

    // 3. Resolve Media URLs
    let resolvedImages: string[] = [];
    if (Array.isArray(post.images) && post.images.length > 0) {
      resolvedImages = post.images;
    } else if (Array.isArray(post.imageurl) && post.imageurl.length > 0) {
      resolvedImages = post.imageurl;
    } else if (typeof post.imageurl === 'string' && post.imageurl) {
      resolvedImages = [post.imageurl];
    } else if (typeof post.imageUrl === 'string' && post.imageUrl) {
      resolvedImages = [post.imageUrl];
    } else if (typeof post.image === 'string' && post.image) {
      resolvedImages = [post.image];
    } else if (post.data && typeof post.data === 'object') {
      if (Array.isArray(post.data.images)) resolvedImages = post.data.images;
      else if (post.data.imageUrl) resolvedImages = [post.data.imageUrl];
    }

    // 4. Resolve Creation Date (fallback to ObjectId creation timestamp)
    let createdAtDate = post.createdAt || post.created_at || post.timestamp;
    if (!createdAtDate && post._id && Types.ObjectId.isValid(post._id)) {
      createdAtDate = new Types.ObjectId(post._id).getTimestamp();
    }

    return {
      ...post,
      content: extractedContent,
      images: resolvedImages,
      createdAt: createdAtDate ? new Date(createdAtDate).toISOString() : new Date().toISOString(),
      author: {
        name: authorName,
        picture: authorPicture,
        college: authorCollege,
      },
      likesCount: Math.max(0, typeof post.likes === 'number' ? post.likes : likesArray.length),
      savesCount: Math.max(0, typeof post.saves === 'number' ? post.saves : savesArray.length),
      isLikedByCurrentUser: userId ? likesArray.some((id: any) => id?.toString() === userId.toString()) : false,
      isSavedByCurrentUser: userId ? (savesArray.some((id: any) => id?.toString() === userId.toString()) || 
                            userSavedPosts.some((id: any) => id?.toString() === post._id?.toString())) : false,
    };
  }

  // 🔒 AUTH REQUIRED: Create Post
  async createPost(body: any, files: any[], userId: string) {
    const userObjectId = this.requireAuthUser(userId);
    
    const postType = body.postType || body.post_type;
    const contentData = body.data || body.content || body.caption;

    if (!postType || !contentData) {
      throw new BadRequestException("Post type and content are required.");
    }

    const currentUser: any = await this.userModel.findById(userObjectId).lean();
    if (!currentUser) {
      throw new NotFoundException("User account not found.");
    }

    let imageurls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        if (!file.buffer) continue;
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
      postType: postType,
      data: contentData,
      content: contentData,
      userId: currentUser._id,
      username: currentUser.username || currentUser.name,
      picture: currentUser.picture || currentUser.avatar,
      imageurl: imageurls,
      images: imageurls,
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

  // 🌐 PUBLIC ACCESS: View Feed with type filtering
  async getFeed(type: string, userId: string | undefined, pageNum: number): Promise<any[]> {
    const limit = 10;
    const skip = (pageNum - 1) * limit;

    const queryFilter: any = {};
    if (type && type !== 'recent' && type !== 'all') {
      queryFilter.postType = type;
    }

    try {
      const rawPosts = await this.postModel
        .find(queryFilter)
        .populate('userId', 'name username picture avatar college profilePicture')
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

      return rawPosts
        .map((post: any) => this.formatPost(post, userId, userSavedPosts))
        .filter((post: any) => post !== null);
    } catch (error) {
      console.error('🚨 Error inside getFeed service:', error);
      return [];
    }
  }

  // 🌐 PUBLIC ACCESS: View Featured
  async getFeatured(userId?: string): Promise<any[]> {
    try {
      const rawFeatured = await this.featuredModel
        .find()
        .sort({ _id: -1 })
        .limit(5)
        .lean();

      if (!rawFeatured || rawFeatured.length === 0) {
        return [];
      }

      let userSavedPosts: any[] = [];
      if (userId && Types.ObjectId.isValid(userId)) {
        const user: any = await this.userModel.findById(userId).lean();
        if (user && Array.isArray(user.savedPosts)) {
          userSavedPosts = user.savedPosts;
        }
      }

      return rawFeatured
        .map((feat: any) => this.formatPost(feat, userId, userSavedPosts))
        .filter((item: any) => item !== null);
    } catch (error) {
      console.error('🚨 Failed to fetch featured posts:', error);
      return [];
    }
  }

  // 🌐 PUBLIC ACCESS: View Single Post
  async getPostById(postId: string, userId?: string): Promise<any> {
    if (!postId || !Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID');
    }
    return this.getNormalizedPostForUser(postId, userId);
  }

  // 🔒 AUTH REQUIRED: Toggle Like
  async toggleLikePost(postId: string, userId: string): Promise<any> {
    const userObjectId = this.requireAuthUser(userId);
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post ID');

    const postObjectId = new Types.ObjectId(postId);
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

  // 🔒 AUTH REQUIRED: Toggle Save
  async toggleSavePost(postId: string, userId: string): Promise<any> {
    const userObjectId = this.requireAuthUser(userId);
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post ID');

    const postObjectId = new Types.ObjectId(postId);
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

  // 🔒 AUTH REQUIRED: Save Event
  async toggleSaveEvent(postId: string, userId: string): Promise<any> {
    const userObjectId = this.requireAuthUser(userId);
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post ID');

    const postObjectId = new Types.ObjectId(postId);
    const post: any = await this.postModel.findById(postObjectId);
    if (!post) throw new NotFoundException('Post not found');

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

  // 🔒 AUTH REQUIRED: Get Saved Events
  async getSavedEvents(userId: string): Promise<any[]> {
    const userObjectId = this.requireAuthUser(userId);

    const user: any = await this.userModel.findById(userObjectId)
      .populate({
        path: 'savedEvents',
        match: { postType: 'event' },
        options: { sort: { createdAt: -1 } }
      })
      .lean();

    if (!user || !Array.isArray(user.savedEvents)) {
      return [];
    }

    return user.savedEvents
      .filter((event: any) => event !== null && typeof event === 'object')
      .map((event: any) => this.formatPost(event, userId))
      .filter((event: any) => event !== null);
  }

  // 🌐 PUBLIC / HYBRID: Track Share
  async trackSharePost(postId: string, userId?: string): Promise<any> {
    if (!postId || !Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID');
    }

    const postObjectId = new Types.ObjectId(postId);
    
    if (userId && Types.ObjectId.isValid(userId)) {
      const userObjectId = new Types.ObjectId(userId);
      await this.postModel.updateOne({ _id: postObjectId }, { $addToSet: { sharedBy: userObjectId } });
    }
    
    return this.getNormalizedPostForUser(postId, userId);
  }

  private async getNormalizedPostForUser(postId: string, userId?: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID');
    }
    const post: any = await this.postModel
      .findById(postId)
      .populate('userId', 'name username picture avatar college profilePicture')
      .lean();

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
