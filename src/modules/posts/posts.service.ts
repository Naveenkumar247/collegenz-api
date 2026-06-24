import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schema/post.schema';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  // 🟢 1. The Missing Create Method needed by your Controller
  async create(caption: string, imageUrl: string, userId: string, name: string) {
    return this.postModel.create({
      caption,
      image: imageUrl,
      user: new Types.ObjectId(userId),
      authorName: name,
      likes: [],
      type: 'recent',
      createdAt: new Date(),
    });
  }

  // 🟢 2. Your Bulletproof Permissive Feed Fetcher
  async getFeed(type: string, currentUserId: string, page: number = 1) {
    const limit = 10;
    const skip = (page - 1) * limit;

    const matchQuery: any = {};
    if (type !== 'recent' && type !== 'all') {
      matchQuery.type = type;
    }

    return this.postModel.aggregate([
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'authorDetails',
        },
      },
      { $unwind: { path: '$authorDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          caption: { $ifNull: ['$caption', '$text', '$title', ''] },
          image: { $ifNull: ['$image', '$imageUrl', ''] },
          type: { $ifNull: ['$type', 'recent'] },
          createdAt: { $ifNull: ['$createdAt', new Date()] },
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          author: {
            username: { $ifNull: ['$authorDetails.username', '$authorName', '$username', 'Anonymous Student'] },
            picture: { $ifNull: ['$authorDetails.picture', '$profilePic', 'https://www.svgrepo.com/show/532362/user.svg'] },
          },
        },
      },
    ]);
  }
}
