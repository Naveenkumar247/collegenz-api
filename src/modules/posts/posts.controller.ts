import { Controller, Get, Post, Param, Query, Req, UseInterceptors, UploadedFiles, Body, UnauthorizedException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  private extractUserId(req: any): string {
    // 1. If an AuthGuard successfully populated the user, use it.
    if (req?.user?.sub) return req.user.sub;
    if (req?.user?.id) return req.user.id;
    
    // 2. Fallback: Manually decode the JWT from the headers
    const authHeader = req?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        return payload.sub || payload.id || payload._id || '';
      } catch (e) {
        return '';
      }
    }
    return '';
  }

  @Get('featured')
  async getFeatured() {
    return this.postsService.getFeatured();
  }

  @Get('feed')
  async getFeed(
    @Query('type') type: string,
    @Query('page') page: string,
    @Req() req: any,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const userId = this.extractUserId(req);
    return this.postsService.getFeed(type || 'recent', userId, pageNum);
  }

  @Post('submit')
  @UseInterceptors(FilesInterceptor('images', 10))
  async submitPost(
    @UploadedFiles() files: any[], // 🟢 FIXED: Removed Express.Multer strict typing
    @Body() body: any,
    @Req() req: any
  ) {
    const userId = this.extractUserId(req);
    
    if (!userId) {
      throw new UnauthorizedException('Please login to create a post.');
    }

    return await this.postsService.createPost(body, files, userId);
  }

  @Post(':id/like')
  async toggleLikePost(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    const userId = this.extractUserId(req);
    return this.postsService.toggleLikePost(postId, userId);
  }

  @Post(':id/save')
  async toggleSavePost(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    const userId = this.extractUserId(req);
    return this.postsService.toggleSavePost(postId, userId);
  }

  @Post(':id/share')
  async trackSharePost(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    const userId = this.extractUserId(req);
    return this.postsService.trackSharePost(postId, userId);
  }
}
