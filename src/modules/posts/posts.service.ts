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
      let resolvedImage = '';
      
      // 🟢 FIXED: Checking 'doc.imageurl' (all lowercase) along with the other options
      const targetImages = doc.imageUrl || doc.imageurl || doc.image;

      if (Array.isArray(targetImages) && targetImages.length > 0) {
        resolvedImage = targetImages[0];
      } else if (typeof targetImages === 'string' && targetImages.trim() !== '') {
        resolvedImage = targetImages;
      }

      return {
        _id: doc._id,
        caption: doc.data || doc.caption || '',
        image: resolvedImage, 
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

  // Add this method inside your existing PostsService class
async getFeatured() {
  const featuredCollection = this.connection.db.collection('featureds');
  
  const rawFeatured = await featuredCollection
    .find({})
    .sort({ featuredOrder: 1 }) // Sort cards chronologically by your field
    .toArray();

  return rawFeatured.map((doc: any) => {
    let resolvedImage = '';
    const targetImages = doc.imageUrl || doc.imageurl || doc.image;

    if (Array.isArray(targetImages) && targetImages.length > 0) {
      resolvedImage = targetImages[0];
    } else if (typeof targetImages === 'string' && targetImages.trim() !== '') {
      resolvedImage = targetImages;
    }

    return {
      _id: doc._id,
      caption: doc.data || doc.caption || '',
      image: resolvedImage,
      type: doc.postType || 'general',
      featuredOrder: doc.featuredOrder || 0,
      author: {
        username: doc.username || 'CollegenZ User',
        picture: doc.picture || 'https://www.svgrepo.com/show/532362/user.svg',
      },
    };
  });
}
  
}
