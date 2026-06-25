import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller'; // 🟢 Singular filename, plural class
import { UsersService } from './users.service';       // 🟢 Singular filename, plural class
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
