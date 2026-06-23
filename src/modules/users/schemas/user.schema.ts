import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ _id: false })
export class InternshipProfile {
  @Prop({ default: 'CodeAlpha' })
  companyName: string;

  @Prop({ type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  status: string;

  @Prop({ default: '09.06.2026' })
  startDate: string;

  @Prop({ default: '09.07.2026' })
  endDate: string;

  @Prop({ default: '09.08.2026' })
  deadlineDate: string;

  @Prop({ default: 50 })
  progress: number;

  @Prop({ default: 4 })
  noOfTask: number;

  @Prop({ default: 2 })
  noOfCompletedTask: number;

  @Prop({ default: 2 })
  noOfPendingTask: number;

  @Prop({ default: 'Amir' })
  nameOfMentor: string;

  @Prop({ default: 44 })
  noOfStudents: number;

  @Prop({ default: 2 })
  noOfTaskAssigned: number;

  @Prop({ default: 2 })
  noOfTaskPending: number;
}

@Schema({ _id: false })
export class SavedPostItem {
  @Prop({ type: Types.ObjectId, ref: 'Post' })
  postId: Types.ObjectId;

  @Prop()
  data: string;

  @Prop({ type: [String] })
  imageurl: string[];

  @Prop()
  event_date: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  userEmail: string;
}

@Schema({ collection: 'logins', timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ lowercase: true, trim: true, unique: true, sparse: true, default: null })
  username: string;

  @Prop({ default: null })
  age: number;

  @Prop({ default: null })
  phone: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: null })
  password?: string;

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

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  followers: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  following: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  friends: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  friendRequestsSent: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  friendRequestsReceived: Types.ObjectId[];

  @Prop({ type: String, enum: ['public', 'personal', 'business'], default: 'public' })
  accountType: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Post' }], default: [] })
  likedPosts: Types.ObjectId[];

  @Prop({ type: [SavedPostItem], default: [] })
  savedPosts: SavedPostItem[];

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

  @Prop({ type: [InternshipProfile], default: [] })
  internshipProfiles: InternshipProfile[];
}

export const UserSchema = SchemaFactory.createForClass(User);
