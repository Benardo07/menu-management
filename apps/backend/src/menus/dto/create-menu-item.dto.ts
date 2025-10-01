import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateMenuItemDto {
  @IsUUID()
  parentId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;
}
