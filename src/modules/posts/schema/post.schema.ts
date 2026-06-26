import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ collection: 'users', strict: false }) // 🟢 strict: false prevents Mongoose from dropping fields
export class Post {
  @Prop({ type: MongooseSchema.Types.Mixed })
  data: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  imageUrl: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  userId: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  username: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  likedBy: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  postType: any;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
likes: Types.ObjectId[];

@Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
savedBy: Types.ObjectId[];
  
}

export const PostSchema = SchemaFactory.createForClass(Post);
