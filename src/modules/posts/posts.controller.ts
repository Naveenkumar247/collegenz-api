import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  Req, 
  UseGuards 
} from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // 1. GET HORIZONTAL FEATURED STORIES PANEL -> /api/v1/posts/featured
  @Get('featured')
  async getFeatured() {
    return this.postsService.getFeatured();
  }

  // 2. GET MAIN TIMELINE FEED STREAM -> /api/v1/posts/feed
  @Get('feed')
  async getFeed(
    @Query('type') type: string,
    @Query('page') page: string,
    @Req() req: any,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    // req?.user?.sub extracts your authenticated JWT user ID if present, otherwise passes an empty string for guests
    return this.postsService.getFeed(
      type || 'recent', 
      req?.user?.sub || '', 
      pageNum
    );
  }

  // 3. TOGGLE LIKE STATUS -> POST /api/v1/posts/:id/like
  @Post(':id/like')
  async toggleLikePost(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    const userId = req?.user?.sub || req?.user?.id;
    return this.postsService.toggleLikePost(postId, userId);
  }

  // 4. TOGGLE BOOKMARK SAVE STATUS -> POST /api/v1/posts/:id/save
  @Post(':id/save')
  async toggleSavePost(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    const userId = req?.user?.sub || req?.user?.id;
    return this.postsService.toggleSavePost(postId, userId);
  }

  // 5. INCREMENT SHARE TRACKING METRICS -> POST /api/v1/posts/:id/share
  @Post(':id/share')
  async trackSharePost(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    const userId = req?.user?.sub || req?.user?.id || 'guest';
    return this.postsService.trackSharePost(postId, userId);
  }
}
