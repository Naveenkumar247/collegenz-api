import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Post, PostSchema } from './schemas/post.schema';
import { Session, SessionSchema } from './schemas/session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  controllers: [],
  providers: [],
  // Exporting structural models so AuthModule or PostModule can consume them immediately
  exports: [MongooseModule],
})
export class UsersModule {}
