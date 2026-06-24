import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { UsersModule } from '../users/users.module';
import { Post, PostSchema } from '../users/schemas/post.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    UsersModule, // Pulls model definitions safely
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule, // Needed by Guards to verify signatures
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
