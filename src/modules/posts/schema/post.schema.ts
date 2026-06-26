import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PostDocument = Post & Document;

// 🟢 WORKAROUND: If your posts are sitting inside your main 'users' collection or a custom 'feed' table, 
// 🟢 change the string 'posts' below to 'users' or 'feed' to point Mongoose to your data instantly!
// 🟢 Replace 'posts' with your exact MongoDB collection name (e.g., 'feeds', 'user_posts', or 'users')
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

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  likes: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  savedBy: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  sharedBy: MongooseSchema.Types.ObjectId[];
}

export const PostSchema = SchemaFactory.createForClass(Post);
