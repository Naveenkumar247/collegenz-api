import { Controller, Post, Get, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async createPost(@Body() createPostDto: CreatePostDto, @CurrentUser() user: any) {
    return this.postsService.create(createPostDto, user.sub, user.email);
  }

  @Get('feed')
  async getFeed(
    @Query('type') type: string,
    @Query('page') page: string,
    @CurrentUser() user: any,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    return this.postsService.getFeed(type, user.sub, pageNum);
  }

  @Post(':id/like')
  async likePost(@Param('id') postId: string, @CurrentUser() user: any) {
    return this.postsService.toggleLike(postId, user.sub);
  }

  @Delete(':id')
  async deletePost(@Param('id') postId: string, @CurrentUser() user: any) {
    return this.postsService.delete(postId, user.sub);
  }
}
