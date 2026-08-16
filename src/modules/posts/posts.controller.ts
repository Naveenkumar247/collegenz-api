import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  Req, 
  UseInterceptors, 
  UploadedFiles, 
  Body, 
  UnauthorizedException 
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // 🛠️ Helper: Optional extraction for public/guest-friendly endpoints
  private extractUserId(req: any): string {
    if (req?.user?.sub) return req.user.sub;
    if (req?.user?.id) return req.user.id;
    if (req?.user?._id) return req.user._id.toString();

    const authHeader = req?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          return payload.sub || payload.id || payload._id || '';
        }
      } catch {
        return '';
      }
    }
    return '';
  }

  // 🛠️ Helper: Mandatory extraction for protected routes
  private requireUserId(req: any, message: string): string {
    const userId = this.extractUserId(req);
    if (!userId) {
      throw new UnauthorizedException(message);
    }
    return userId;
  }

  // 🌐 PUBLIC: View featured posts (Guest or Logged in)
  @Get('featured')
  async getFeatured(@Req() req: any) {
    const userId = this.extractUserId(req);
    return this.postsService.getFeatured(userId);
  }

  // 🌐 PUBLIC: View feed (Guest or Logged in)
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

  // 🔒 PROTECTED: View saved events (Must be placed BEFORE @Get(':id'))
  @Get('saved-events')
  async getSavedEvents(@Req() req: any) {
    const userId = this.requireUserId(req, 'Please login to view saved events.');
    return this.postsService.getSavedEvents(userId);
  }

  // 🌐 PUBLIC: View single post by ID
  @Get(':id')
  async getPostById(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    const userId = this.extractUserId(req);
    return this.postsService.getPostById(postId, userId);
  }

  // 🔒 PROTECTED: Create post
  @Post('submit')
  @UseInterceptors(FilesInterceptor('images', 10))
  async submitPost(
    @UploadedFiles() files: any[],
    @Body() body: any,
    @Req() req: any
  ) {
    const userId = this.requireUserId(req, 'Please login to create a post.');
    return await this.postsService.createPost(body, files, userId);
  }

  // 🔒 PROTECTED: Like post
  @Post(':id/like')
  async toggleLikePost(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    const userId = this.requireUserId(req, 'Please login to like posts.');
    return this.postsService.toggleLikePost(postId, userId);
  }

  // 🔒 PROTECTED: Save post
  @Post(':id/save')
  async toggleSavePost(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    const userId = this.requireUserId(req, 'Please login to save posts.');
    return this.postsService.toggleSavePost(postId, userId);
  }

  // 🔒 PROTECTED: Save event to calendar
  @Post(':id/save-event')
  async toggleSaveEvent(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    const userId = this.requireUserId(req, 'Please login to save events.');
    return this.postsService.toggleSaveEvent(postId, userId);
  }

  // 🌐 PUBLIC/HYBRID: Share tracking
  @Post(':id/share')
  async trackSharePost(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    const userId = this.extractUserId(req);
    return this.postsService.trackSharePost(postId, userId);
  }
}
