import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { FeaturedPostsService } from './featured-posts.service';
import { CreateFeaturedPostDto } from './dto/create-featured-post.dto';

@Controller('featured-posts')
export class FeaturedPostsController {
  constructor(private readonly featuredPostsService: FeaturedPostsService) {}

  @Post()
  create(@Body() createDto: CreateFeaturedPostDto) {
    return this.featuredPostsService.create(createDto);
  }

  @Get()
  findAll() {
    return this.featuredPostsService.findAll();
  }

  @Delete(':postId')
  remove(@Param('postId') postId: string) {
    return this.featuredPostsService.remove(postId);
  }
}
