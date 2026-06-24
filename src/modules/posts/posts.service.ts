import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schema/post.schema';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  // 🟢 ADDED BACK: The missing create method so your controller compiles!
  async create(caption: string, imageUrl: string, userId: string, name: string) {
    return this.postModel.create({
      data: caption,
      imageUrl: [imageUrl],
      userId: userId,
      username: name,
      likedBy: [],
      postType: 'general',
      createdAt: new Date(),
    });
  }

  async getFeed(type: string, currentUserId: string, page: number = 1) {
    const limit = 20;
    const skip = (page - 1) * limit;

    // Check your primary schema collection ('users')
    const currentCollectionDocs = await this.postModel.find({}).limit(5).lean().exec();

    // Check your sibling collection ('posts') directly 
    const siblingCollection = this.postModel.db.collection('posts');
    const siblingDocs = await siblingCollection.find({}).limit(5).toArray();

    // Dynamically fallback so your screen is guaranteed to see data from either folder
    const activeDocs = siblingDocs.length > 0 ? siblingDocs : currentCollectionDocs;

    return activeDocs.map((doc: any) => {
      let resolvedImage = '';
      if (Array.isArray(doc.imageUrl) && doc.imageUrl.length > 0) {
        resolvedImage = doc.imageUrl[0];
      } else if (typeof doc.imageUrl === 'string') {
        resolvedImage = doc.imageUrl;
      } else if (doc.image) {
        resolvedImage = doc.image;
      }

      return {
        _id: doc._id,
        caption: doc.data || doc.caption || doc.text || 'Untitled Post Data Structure',
        image: resolvedImage,
        type: doc.postType || doc.type || 'recent',
        createdAt: doc.createdAt || new Date(),
        likesCount: Array.isArray(doc.likedBy) ? doc.likedBy.length : 0,
        author: {
          username: doc.username || doc.authorName || 'CollegenZ User',
          picture: doc.picture || 'https://www.svgrepo.com/show/532362/user.svg',
        },
      };
    });
  }
}

