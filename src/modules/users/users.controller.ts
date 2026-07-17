import { Controller, Get, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    // 🟢 Safe extraction: matches the object returned by JwtStrategy
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new UnauthorizedException('Authentication session expired or invalid.');
    }
    
    return await this.usersService.findOneById(userId);
  }
}
