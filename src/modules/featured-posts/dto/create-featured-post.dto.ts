import { IsNotEmpty, IsMongoId, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateFeaturedPostDto {
  @IsNotEmpty()
  @IsMongoId()
  postId: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
