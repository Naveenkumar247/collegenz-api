import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PostDocument = Post & Document;

// 🟢 strict: false ensures that old unstructured posts without likes/savedBy don't get dropped
@Schema({ collection: 'posts', strict: false, timestamps: true }) 
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
  likedBy: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  postType: any;

  // 🟢 Core structured relation arrays using MongooseSchema namespaces explicitly
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  likes: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  savedBy: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  sharedBy: MongooseSchema.Types.ObjectId[];
}

export const PostSchema = SchemaFactory.createForClass(Post);
