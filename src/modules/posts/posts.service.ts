import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class PostsService {
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
    const rawCollection = this.connection.db.collection('users');

    const rawDocs = await rawCollection
      .find({})
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return rawDocs.map((doc: any) => {
      // 🟢 FOOLPROOF IMAGE PARSER: Check all possible database field spellings
      let resolvedImage = '';
      
      if (Array.isArray(doc.imageUrl) && doc.imageUrl.length > 0) {
        resolvedImage = doc.imageUrl[0];
      } else if (typeof doc.imageUrl === 'string' && doc.imageUrl.trim() !== '') {
        resolvedImage = doc.imageUrl;
      } else if (typeof doc.image === 'string' && doc.image.trim() !== '') {
        resolvedImage = doc.image;
      } else if (Array.isArray(doc.image) && doc.image.length > 0) {
        resolvedImage = doc.image[0];
      }

      return {
        _id: doc._id,
        caption: doc.data || doc.caption || '',
        image: resolvedImage, // Sent directly to PostCard component
        type: doc.postType || 'general',
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
