import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ collection: 'logins', timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ default: null, lowercase: true, trim: true, unique: true })
  username: string;

  @Prop({ default: null })
  age: number;

  @Prop({ default: null })
  phone: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: null })
  password: string;

  @Prop({ default: null })
  dob: string;

  @Prop({ default: null })
  college: string;

  @Prop({ default: null })
  bio: string;

  @Prop({ default: 'https://collegenz.in/uploads/profilepic.jpg' })
  picture: string;

  @Prop({ default: null })
  dream: string;

  @Prop({ default: false })
  googleUser: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  followers: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  following: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  friends: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  friendRequestsSent: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  friendRequestsReceived: MongooseSchema.Types.ObjectId[];

  @Prop({ type: String, enum: ['public', 'personal', 'business'], default: 'public' })
  accountType: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Post' }], default: [] })
  likedPosts: MongooseSchema.Types.ObjectId[];

  @Prop({
    type: [
      {
        postId: { type: MongooseSchema.Types.ObjectId, ref: 'Post' },
        data: String,
        imageurl: [String],
        event_date: Date,
        createdAt: { type: Date, default: Date.now },
        userEmail: String,
      },
    ],
    default: [],
  })
  savedPosts: any[];

  // 🟢 ADDED: Event Reminder Saver
  // References the Post collection strictly to isolate event bookmarks
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Post' }], default: [] })
  savedEvents: MongooseSchema.Types.ObjectId[];

  @Prop({ default: 0 })
  points: number;

  @Prop({ default: null })
  learningpath: string;

  @Prop({ default: 0 })
  postCount: number;

  @Prop({ default: () => Math.floor(Math.random() * 10000) })
  rank: number;

  @Prop({ default: 0 })
  totalLikes: number;

  @Prop({ default: 0 })
  totalSaves: number;

  @Prop({ default: null })
  instagram: string;

  @Prop({ default: null })
  linkedin: string;

  @Prop({ default: null })
  youtube: string;

  @Prop({ default: null })
  website: string;

  @Prop({ type: String, enum: ['user', 'intern', 'mentor'], default: 'user' })
  zrole: string;

  // 🟢 PERSISTENCE UPGRADE: Track all active device connections directly inside the MongoDB cluster
  @Prop({
    type: [
      {
        sessionId: { type: String, required: true },
        deviceAgent: { type: String, default: 'Unknown Device' },
        ipAddress: { type: String, default: '127.0.0.1' },
        loginTime: { type: Date, default: Date.now },
        lastActive: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  activeSessions: any[];
}

export const UserSchema = SchemaFactory.createForClass(User);
