import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateMenuItemDto {
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;
}
