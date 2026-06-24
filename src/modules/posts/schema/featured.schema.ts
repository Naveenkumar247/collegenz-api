import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type FeaturedDocument = Featured & Document;

@Schema({ 
  collection: 'featureds', // Explicitly targets your collection folder
  timestamps: true        
})
export class Featured {
  @Prop({ required: true })
  postType: string;

  @Prop({ required: true })
  data: string;

  @Prop({ type: [String], default: [] })
  imageurl: string[]; // Exact lowercase match for your array field

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true, default: true })
  isFeatured: boolean;

  @Prop({ required: true, default: 0 })
  featuredOrder: number;

  @Prop({ type: Date, required: true })
  featuredUntil: Date;

  @Prop({ type: Number, default: 0 })
  likes: number;

  @Prop({ type: [String], default: [] })
  likedBy: string[];

  @Prop({ type: [String], default: [] })
  shares: string[];

  @Prop({ type: [String], default: [] })
  sharedBy: string[];

  @Prop({ default: null })
  picture: string | null;

  @Prop({ default: 'APPROVED' })
  status: string;
}

export const FeaturedSchema = SchemaFactory.createForClass(Featured);
