import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post, PostSchema } from './schema/post.schema';
import { User, UserSchema } from '../users/schema/user.schema';
// 🟢 FIXED: Import the Featured Schema here
import { Featured, FeaturedSchema } from './schema/featured.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
      // 🟢 FIXED: Register the Featured Schema so PostsService can use it
      { name: Featured.name, schema: FeaturedSchema },
    ]),
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
