import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

    return this.postModel.aggregate([
      // 1. Grab everything from the collection sorted by newest first
      { $sort: { _id: -1 } },
      { $skip: skip },
      { $limit: limit },
      
      // 2. Map your exact MongoDB fields right into what your frontend layout expects
      {
        $project: {
          _id: 1,
          // Extract string from 'data' field
          caption: { $ifNull: ['$data', ''] },
          
          // Since imageUrl is an Array in your screenshot, grab the first element safely
          image: { 
            $cond: {
              if: { $and: [{ $isArray: '$imageUrl' }, { $gt: [{ $size: '$imageUrl' }, 0] }] },
              then: { $arrayElemAt: ['$imageUrl', 0] },
              else: ''
            }
          },
          
          type: { $ifNull: ['$postType', 'recent'] },
          createdAt: { $ifNull: ['$createdAt', new Date()] },
          
          // Count your exact 'likedBy' array safely
          likesCount: {
            $cond: {
              if: { $isArray: '$likedBy' },
              then: { $size: '$likedBy' },
              else: 0
            }
          },
          
          // Construct the author details using your stored username and picture fields
          author: {
            username: { $ifNull: ['$username', 'CollegenZ User'] },
            picture: { $ifNull: ['$picture', 'https://www.svgrepo.com/show/532362/user.svg'] },
          },
        },
      },
    ]);
  }
}
