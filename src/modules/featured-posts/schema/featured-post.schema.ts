import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeaturedPostDocument = FeaturedPost & Document;

@Schema({ 
  timestamps: true,
  collection: 'featuredposts' // Explicitly targets your MongoDB collection name
})
export class FeaturedPost {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true, unique: true })
  postId: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  priority: number;

  @Prop({ type: Date, default: null })
  expiresAt: Date;
}

// Fixed class reference name here:
export const FeaturedPostSchema = SchemaFactory.createForClass(FeaturedPost);
