import { Controller, Get, Post, Param, Query, Req, UseInterceptors, UploadedFiles, Body, UnauthorizedException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  private extractUserId(req: any): string {
    if (req?.user?.sub) return req.user.sub;
    if (req?.user?.id) return req.user.id;
  
  const authHeader = req?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
         try {
      // 'base64url' properly handles JWT URL-safe base64 strings
           const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
           return payload.sub || payload.id || payload._id || '';
    } catch (e) {
      return '';
    }
  }
  return '';
}
  

  // 🟢 PUBLIC: Anyone can view featured posts
  @Get('featured')
  async getFeatured(@Req() req: any) {
    const userId = this.extractUserId(req); // Optional: returns '' for guests
    return this.postsService.getFeatured(userId);
  }

  // 🟢 PUBLIC: Anyone can view the post feed
  @Get('feed')
  async getFeed(
    @Query('type') type: string,
    @Query('page') page: string,
    @Req() req: any,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const userId = this.extractUserId(req); // Optional: returns '' for guests
    return this.postsService.getFeed(type || 'recent', userId, pageNum);
  }

  // 🔒 PROTECTED: Only logged-in users can view saved events
  @Get('saved-events')
  async getSavedEvents(@Req() req: any) {
    const userId = this.extractUserId(req);
    if (!userId) {
      throw new UnauthorizedException('Please login to view saved events.');
    }
    return this.postsService.getSavedEvents(userId);
  }

  // 🟢 PUBLIC: Single post lookup (Placed before parameterized actions)
  @Get(':id')
  async getPostById(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    const userId = this.extractUserId(req); // Optional: returns '' for guests
    return this.postsService.getPostById(postId, userId);
  }

  // 🔒 PROTECTED: Submit post
  @Post('submit')
  @UseInterceptors(FilesInterceptor('images', 10))
  async submitPost(
    @UploadedFiles() files: any[],
    @Body() body: any,
    @Req() req: any
  ) {
    const userId = this.extractUserId(req);
    if (!userId) {
      throw new UnauthorizedException('Please login to create a post.');
    }
    return await this.postsService.createPost(body, files, userId);
  }

  // 🔒 PROTECTED: Toggle Like
  @Post(':id/like')
  async toggleLikePost(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    const userId = this.extractUserId(req);
    if (!userId) {
      throw new UnauthorizedException('Please login to like posts.');
    }
    return this.postsService.toggleLikePost(postId, userId);
  }

  // 🔒 PROTECTED: Toggle Save
  @Post(':id/save')
  async toggleSavePost(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    const userId = this.extractUserId(req);
    if (!userId) {
      throw new UnauthorizedException('Please login to save posts.');
    }
    return this.postsService.toggleSavePost(postId, userId);
  }

  // 🔒 PROTECTED: Save Event
  @Post(':id/save-event')
  async toggleSaveEvent(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    const userId = this.extractUserId(req);
    if (!userId) {
      throw new UnauthorizedException('Please login to save events.');
    }
    return this.postsService.toggleSaveEvent(postId, userId);
  }

  // 🟢 PUBLIC: Share tracking (Allows both guests and users to trigger share counts)
  @Post(':id/share')
  async trackSharePost(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    const userId = this.extractUserId(req);
    return this.postsService.trackSharePost(postId, userId);
  }
}
