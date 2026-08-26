import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeaturedPostDocument = FeaturedPost & Document;

@Schema({ timestamps: true })
export class FeaturedPost {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true, unique: true })
  postId: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  priority: number;

  @Prop({ type: Date, default: null })
  expiresAt: Date;
}

export const FeaturedPostSchema = SchemaFactory.createForClass(FeaturedPosts);
