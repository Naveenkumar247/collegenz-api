import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class PostsService {
  // 🟢 Inject the raw database connection instance directly, bypassing the Model wrapper entirely
  constructor(@InjectConnection() private connection: Connection) {}

  async create(caption: string, imageUrl: string, userId: string, name: string) {
    const rawCollection = this.connection.db.collection('users');
    return rawCollection.insertOne({
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

    // 🟢 Target the raw collection directly by its exact string name
    const rawCollection = this.connection.db.collection('users');

    // Fetch the raw array directly from MongoDB without Mongoose processing it
    const rawDocs = await rawCollection
      .find({})
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

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
