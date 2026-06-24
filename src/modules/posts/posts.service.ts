import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schema/post.schema';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

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
          localField: 'user', // Tries standard relation
          foreignField: '_id',
          as: 'authorDetails',
        },
      },
      { $unwind: { path: '$authorDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          // 🟢 Bulletproof fallbacks: use 'caption' or fallback to 'text' / 'title' fields if named differently
          caption: { $ifNull: ['$caption', '$text', '$title', ''] },
          // 🟢 Support both 'image' and 'imageUrl' formats
          image: { $ifNull: ['$image', '$imageUrl', ''] },
          type: { $ifNull: ['$type', 'recent'] },
          createdAt: { $ifNull: ['$createdAt', new Date()] },
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          author: {
            // 🟢 If user schema relation is missing, fallback to raw string names recorded in doc
            username: { $ifNull: ['$authorDetails.username', '$authorName', '$username', 'Anonymous Student'] },
            picture: { $ifNull: ['$authorDetails.picture', '$profilePic', 'https://www.svgrepo.com/show/532362/user.svg'] },
          },
        },
      },
    ]);
  }
}
