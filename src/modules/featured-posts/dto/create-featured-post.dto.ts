import {
  IsOptional,
  IsNumber,
  IsDateString,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFeaturedPostDto {
  @IsNotEmpty({ message: 'title should not be empty' })
  @IsString()
  title: string;

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
