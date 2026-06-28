import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ collection: 'users', strict: false, timestamps: true }) 
export class Post extends Document {
  @Prop({ type: MongooseSchema.Types.Mixed })
  data: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  imageUrl: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  userId: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  username: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  postType: any;

  // 🟢 FIXED: 'likes' and 'saves' are numbers in your DB
  @Prop({ type: Number, default: 0 })
  likes: number;

  @Prop({ type: Number, default: 0 })
  saves: number;

  // 🟢 FIXED: 'likedBy' and 'savedBy' are the actual arrays
  @Prop({ type: [MongooseSchema.Types.ObjectId], default: [] })
  likedBy: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], default: [] })
  savedBy: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], default: [] })
  sharedBy: MongooseSchema.Types.ObjectId[];
}

export const PostSchema = SchemaFactory.createForClass(Post);
