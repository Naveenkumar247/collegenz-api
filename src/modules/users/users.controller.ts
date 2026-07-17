import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('auth') // With your main.ts setup, this maps to /api/v1/auth
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile') // This makes the full path /api/v1/auth/profile
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    // Ensure req.user exists from the JwtAuthGuard
    if (!req.user || !req.user.userId) {
      throw new Error("User ID not found in request");
    }
    
    const user = await this.usersService.findOneById(req.user.userId);
    console.log("DEBUG: Backend returning:", user); 
    return user; 
  }
}
