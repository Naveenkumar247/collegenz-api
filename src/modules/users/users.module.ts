import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
// 🟢 FIXED: Changed plural names to match singular NestJS file generation defaults
import { UsersController } from './user.controller'; 
import { UsersService } from './user.service';       
import { User, UserSchema } from './schema/user.schema'; 

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
