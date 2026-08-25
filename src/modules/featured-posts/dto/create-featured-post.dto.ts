import { IsMongoId, IsOptional, IsNumber, IsDateString, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFeaturedPostDto {
  @IsNotEmpty({ message: 'postId should not be empty' })
  @IsMongoId({ message: 'postId must be a mongodb id' })
  postId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
