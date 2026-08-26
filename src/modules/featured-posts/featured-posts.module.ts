import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeaturedPostsController } from './featured-posts.controller';
import { FeaturedPostsService } from './featured-posts.service';
import { FeaturedPost, FeaturedPostSchema } from './schema/featured-post.schema';
import { Post, PostSchema } from '../posts/schema/post.schema'; // Adjust relative path to your Post schema

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeaturedPost.name, schema: FeaturedPostSchema },
      { name: Post.name, schema: PostSchema }, // Required for .populate('postId')
    ]),
  ],
  controllers: [FeaturedPostsController],
  providers: [FeaturedPostsService],
  exports: [FeaturedPostsService],
})
export class FeaturedPostsModule {}
