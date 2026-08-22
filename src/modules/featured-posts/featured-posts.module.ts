import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeaturedPostsController } from './featured-posts.controller';
import { FeaturedPostsService } from './featured-posts.service';
import { FeaturedPost, FeaturedPostSchema } from './schema/featured-post.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeaturedPost.name, schema: FeaturedPostSchema },
    ]),
  ],
  controllers: [FeaturedPostsController],
  providers: [FeaturedPostsService],
  exports: [FeaturedPostsService],
})
export class FeaturedPostsModule {}
