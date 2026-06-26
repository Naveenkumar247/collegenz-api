import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post, PostSchema } from './schema/post.schema';
import { User, UserSchema } from '../users/schema/user.schema'; // 🟢 Adjust this path based on your folders

@Module({
  imports: [
    // 🟢 Register BOTH Post and User models inside this module context
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
