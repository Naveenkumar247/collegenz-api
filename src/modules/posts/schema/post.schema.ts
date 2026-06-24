import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true }) // Automatically manages createdAt and updatedAt tracking fields
export class Post {
  @Prop({ required: true })
  caption: string;

  @Prop({ default: '' })
  image: string; // Stores your Cloudinary image asset URL string cleanly

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId; // References the MongoDB User document ID who created it

  @Prop({ required: true })
  authorName: string; // Safe backup placeholder name string for optimization

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  likes: Types.ObjectId[]; // Array list tracking student accounts who liked the post

  @Prop({ default: 'recent' })
  type: string; // Keeps tabs aligned ('recent', 'event', 'hiring')
}

export const PostSchema = SchemaFactory.createForClass(Post);
