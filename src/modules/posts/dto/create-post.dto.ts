import { IsString, IsEnum, IsOptional, IsArray, IsDateString } from 'class-validator';

export class CreatePostDto {
  @IsEnum(['general', 'event', 'hiring'], { message: 'Invalid post category classification' })
  postType: string;

  @IsString()
  @IsOptional()
  data?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageurl?: string[];

  // --- EVENT SPECIFIC OPTIONAL FIELDS ---
  @IsString()
  @IsOptional()
  event_title?: string;

  @IsString()
  @IsOptional()
  event_location?: string;

  @IsString()
  @IsOptional()
  event_mode?: string;

  @IsDateString()
  @IsOptional()
  event_date?: string;

  @IsString()
  @IsOptional()
  event_time?: string;

  // --- HIRING SPECIFIC OPTIONAL FIELDS ---
  @IsString()
  @IsOptional()
  job_title?: string;

  @IsString()
  @IsOptional()
  job_location?: string;

  @IsString()
  @IsOptional()
  job_mode?: string;

  @IsDateString()
  @IsOptional()
  job_deadline?: string;

  @IsString()
  @IsOptional()
  job_link?: string;
}
