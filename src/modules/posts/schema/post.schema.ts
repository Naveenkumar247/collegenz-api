import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

// 🟢 FORCE NESTJS TO MAP DIRECTLY TO YOUR 'users' COLLECTION
@Schema({ collection: 'users', timestamps: true }) 
export class Post {
  // 🟢 Map your legacy database 'data' field directly to 'caption'
  @Prop({ name: 'data', required: true })
  caption: string;

  // 🟢 Map your legacy array 'imageUrl' field safely
  @Prop({ type: [String], name: 'imageUrl', default: [] })
  image: string[];

  @Prop({ type: Types.ObjectId, name: 'userId', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, name: 'username' })
  authorName: string;

  @Prop({ type: Array, default: [] })
  likedBy: any[];

  @Prop({ default: 'general', name: 'postType' })
  type: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);
