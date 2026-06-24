import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  // 1. Create a brand new post mapping the Cloudinary image URL
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

  // 2. Extract feed data matching your UI with joined MongoDB user profile pictures
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
      // Join with the users collection to extract current user profiles details dynamically
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
          caption: 1,
          image: 1,
          type: 1,
          createdAt: 1,
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          hasLiked: {
            $in: [new Types.ObjectId(currentUserId), { $ifNull: ['$likes', []] }],
          },
          author: {
            username: { $ifNull: ['$authorDetails.username', '$authorName'] },
            picture: { $ifNull: ['$authorDetails.picture', 'https://www.svgrepo.com/show/532362/user.svg'] },
          },
        },
      },
    ]);
  }
}
