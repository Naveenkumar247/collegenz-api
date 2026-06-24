import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schema/post.schema';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async getFeed(type: string, currentUserId: string, page: number = 1) {
    // 🟢 Step 1: Query the collection we are currently attached to ('users')
    const currentCollectionDocs = await this.postModel.find({}).limit(5).lean().exec();
    console.log('Documents found in current schema collection:', currentCollectionDocs);

    // 🟢 Step 2: Query the sibling 'posts' collection directly using the raw driver
    const siblingCollection = this.postModel.db.collection('posts');
    const siblingDocs = await siblingCollection.find({}).limit(5).toArray();
    console.log('Documents found in explicit posts collection:', siblingDocs);

    // Let's merge them to guarantee something displays on your phone screen!
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
