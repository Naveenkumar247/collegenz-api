import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ collection: 'users', timestamps: true })
export class Post {
  @Prop({ type: String, enum: ['event', 'general', 'hiring'], default: 'general' })
  postType: string;

  @Prop({ default: null })
  username: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop()
  data: string;

  @Prop({ type: [String], default: [] })
  imageurl: string[];

  // EVENT FIELDS
  @Prop()
  event_title: string;

  @Prop()
  event_location: string;

  @Prop()
  event_mode: string;

  @Prop()
  event_date: Date;

  @Prop()
  event_time: string;

  @Prop()
  event_contact: string;

  @Prop()
  event_link: string;

  @Prop()
  event_description: string;

  // HIRING FIELDS
  @Prop()
  job_title: string;

  @Prop()
  job_location: string;

  @Prop()
  job_mode: string;

  @Prop()
  job_contact: string;

  @Prop()
  job_description: string;

  @Prop()
  job_deadline: Date;

  @Prop()
  job_link: string;

  @Prop({ type: String, enum: ['APPROVED', 'REJECTED'], default: 'APPROVED' })
  status: string;

  @Prop({ default: null })
  moderationReason: string;

  @Prop({ default: 0 })
  saves: number;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    default: [],
    // Cleaner programmatic sanitization inside NestJS using transformers instead of Mongoose setters
    transform: (val: Types.ObjectId[]) => Array.from(new Set(val.map(id => id.toString()))).map(id => new Types.ObjectId(id))
  })
  savedBy: Types.ObjectId[];

  @Prop()
  userEmail: string;

  @Prop({ default: null })
  picture: string;

  @Prop({ default: null })
  college: string;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likedBy: Types.ObjectId[];

  @Prop({ default: 0 })
  shares: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  sharedBy: Types.ObjectId[];
}

export const PostSchema = SchemaFactory.createForClass(Post);
