import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FeaturedPostDocument = FeaturedPost & Document;

@Schema({
  timestamps: true,
  collection: 'featuredposts',
})
export class FeaturedPost {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  title: string;

  @Prop({
    type: String,
    default: '',
    trim: true,
  })
  description: string;

  @Prop({
    type: [String],
    default: [],
  })
  images: string[];

  @Prop({
    type: Number,
    default: 0,
  })
  priority: number;

  @Prop({
    type: Date,
    default: null,
  })
  expiresAt: Date;
}

export const FeaturedPostSchema =
  SchemaFactory.createForClass(FeaturedPost);
