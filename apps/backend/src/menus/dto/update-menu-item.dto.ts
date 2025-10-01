import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateMenuItemDto {
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  slug?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  url?: string | null;
}
