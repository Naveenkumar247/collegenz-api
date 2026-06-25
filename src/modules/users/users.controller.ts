import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust if your guard path is different

@Controller('api/v1/auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    // req.user is populated by your JwtStrategy/Guard
    return this.usersService.findOneById(req.user.userId);
  }
}
