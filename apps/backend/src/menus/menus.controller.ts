import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  create(@Body() dto: CreateMenuDto) {
    return this.menusService.create(dto);
  }

  @Get()
  findAll() {
    return this.menusService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string, @Query('depth') depth?: string) {
    let depthLimit: number | undefined;

    if (depth !== undefined) {
      const parsed = Number(depth);
      if (Number.isNaN(parsed) || parsed < 0) {
        throw new BadRequestException('depth must be a positive number');
      }
      depthLimit = parsed;
    }

    return this.menusService.findOne(id, depthLimit);
  }

  @Patch(':id')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateMenuDto) {
    return this.menusService.update(id, dto);
  }

  @Post(':id/items')
  createItem(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: CreateMenuItemDto) {
    return this.menusService.createItem(id, dto);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menusService.updateItem(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  removeItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ) {
    return this.menusService.removeItem(id, itemId);
  }
}
