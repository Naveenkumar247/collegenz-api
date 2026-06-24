import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
// ❌ Change from './schemas/post.schema' to:
import { Post, PostSchema } from './schema/post.schema';



@Module({
  imports: [
    // Registers the post data model structure within the MongoDB injection scope
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
