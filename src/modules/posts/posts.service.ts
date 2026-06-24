import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schema/post.schema';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

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

    // 🟢 Fetch raw documents from the collection without model processing restrictions
    const rawDocs = await this.postModel
      .find({})
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return rawDocs.map((doc: any) => {
      let resolvedImage = '';
      if (Array.isArray(doc.imageUrl) && doc.imageUrl.length > 0) {
        resolvedImage = doc.imageUrl[0];
      } else if (typeof doc.imageUrl === 'string') {
        resolvedImage = doc.imageUrl;
      }

      return {
        _id: doc._id,
        caption: doc.data || '',
        image: resolvedImage,
        type: doc.postType || 'recent',
        createdAt: doc.createdAt || new Date(),
        likesCount: Array.isArray(doc.likedBy) ? doc.likedBy.length : 0,
        author: {
          username: doc.username || 'CollegenZ User',
          picture: doc.picture || 'https://www.svgrepo.com/show/532362/user.svg',
        },
      };
    });
  }
}
