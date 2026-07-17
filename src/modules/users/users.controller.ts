import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // 🟢 FIXED: Points directly to the new file (no /guards folder)

@Controller('auth') // Change this from 'api/v1/auth' to 'auth'
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    const user = await this.usersService.findOneById(req.user.userId);
    console.log("DEBUG: Backend returning:", user); // Check Render logs
    return user; 
  }
}

