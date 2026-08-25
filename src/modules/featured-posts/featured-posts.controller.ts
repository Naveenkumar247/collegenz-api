import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { FeaturedPostsService } from './featured-posts.service';
import { CreateFeaturedPostDto } from './dto/create-featured-post.dto';

@Controller('featured-posts')
export class FeaturedPostsController {
  constructor(private readonly featuredPostsService: FeaturedPostsService) {}

  @Post()
  async create(@Body() createDto: CreateFeaturedPostDto) {
    return this.featuredPostsService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.featuredPostsService.findAll();
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.featuredPostsService.remove(id);
  }
}
