import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '../posts/schemas/post.schema';

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
  
  // Smart filtering fallback logic
  if (type === 'recent' || type === 'all') {
    // Matches documents where type is 'recent', 'all', OR doesn't exist at all
    matchQuery.$or = [
      { type: type },
      { type: { $exists: false } }, 
      { type: '' }
    ];
  } else {
    // For specific tabs like 'event' or 'hiring'
    matchQuery.type = type;
  }

  return this.postModel.aggregate([
    { $match: matchQuery },
    { $sort: { createdAt: -1 } }, // Keeps your newest posts at the top
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
        caption: 1,
        image: 1,
        type: { $ifNull: ['$type', 'recent'] }, // Default to recent if blank in UI
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
