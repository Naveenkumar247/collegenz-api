import { Controller, Post, Get, Body, Req, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { upload } from '../../common/config/cloudinary.config';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // 🔓 GET /api/v1/posts/feed - Fetches database items with user pictures joined
  @Get('feed')
  async getFeed(
    @Query('type') type: string,
    @Query('page') page: string,
    @Req() req,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const userId = req.user?.sub || '000000000000000000000000'; // Safe fallback
    return this.postsService.getFeed(type, userId, pageNum);
  }

  // 🔒 POST /api/v1/posts - Intercepts image upload to Cloudinary and saves post metadata
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file')) // Matches your input file name payload key
  async createPost(
    @Body('caption') caption: string,
    @UploadedFile() file: any,
    @Req() req,
  ) {
    // If an image was provided, file.path contains the cloud url from Cloudinary storage
    const imageUrl = file ? file.path : ''; 
    return this.postsService.create(caption, imageUrl, req.user.sub, req.user.name);
  }
}
