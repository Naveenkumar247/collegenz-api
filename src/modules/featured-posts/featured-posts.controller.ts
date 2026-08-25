import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FeaturedPostsService } from './featured-posts.service';
import { CreateFeaturedPostDto } from './dto/create-featured-post.dto';

@Controller('featured-posts')
export class FeaturedPostsController {
  constructor(private readonly featuredPostsService: FeaturedPostsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  async create(
    @Body() createDto: CreateFeaturedPostDto,
    @UploadedFiles() files?: any[],
  ) {
    return this.featuredPostsService.create(createDto, files);
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
