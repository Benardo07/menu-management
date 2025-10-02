import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Menu, MenuItem, Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuResponse, MenuTreeNode } from './menu.types';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMenuDto): Promise<MenuResponse> {
    const menuId = await this.prisma.$transaction(async (tx) => {
      const menu = await tx.menu.create({ data: { name: dto.name } });

      await tx.menuItem.create({
        data: {
          menuId: menu.id,
          title: dto.name,
          isRoot: true,
          order: 0,
        },
      });

      return menu.id;
    });

    return this.findOne(menuId);
  }

  async findAll(): Promise<MenuResponse[]> {
    const menus = await this.prisma.menu.findMany({ orderBy: { createdAt: 'asc' } });

    if (!menus.length) {
      return [];
    }

    const menuIds = menus.map((menu) => menu.id);
    const items = await this.prisma.menuItem.findMany({
      where: { menuId: { in: menuIds } },
      orderBy: [{ parentId: 'asc' }, { order: 'asc' }],
    });

    const itemsByMenu = new Map<string, MenuItem[]>();
    for (const item of items) {
      if (!itemsByMenu.has(item.menuId)) {
        itemsByMenu.set(item.menuId, []);
      }
      itemsByMenu.get(item.menuId)!.push(item);
    }

    return menus.map((menu) => {
      const { root, depth } = this.buildTree(itemsByMenu.get(menu.id) ?? []);
      return this.mapMenu(menu, root, depth);
    });
  }

  async findOne(id: string, depthLimit?: number): Promise<MenuResponse> {
    const menu = await this.prisma.menu.findUnique({ where: { id } });

    if (!menu) {
      throw new NotFoundException(`Menu ${id} not found`);
    }

    const items = await this.prisma.menuItem.findMany({
      where: { menuId: id },
      orderBy: [{ parentId: 'asc' }, { order: 'asc' }],
    });

    const { root, depth } = this.buildTree(items, depthLimit);
    return this.mapMenu(menu, root, depth);
  }

  async update(id: string, dto: UpdateMenuDto): Promise<MenuResponse> {
    const menu = await this.prisma.menu.findUnique({ where: { id } });

    if (!menu) {
      throw new NotFoundException(`Menu ${id} not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.name && dto.name !== menu.name) {
        await tx.menu.update({
          where: { id },
          data: { name: dto.name },
        });

        const root = await this.getRootItem(id, tx);
        await tx.menuItem.update({
          where: { id: root.id },
          data: { title: dto.name },
        });
      }
    });

    return this.findOne(id);
  }

  async createItem(menuId: string, dto: CreateMenuItemDto): Promise<MenuResponse> {
    const parent = await this.ensureMenuItem(menuId, dto.parentId);

    const order = await this.nextOrder(menuId, parent.id);

    await this.prisma.menuItem.create({
      data: {
        menuId,
        parentId: parent.id,
        title: dto.title,
        order,
      },
    });

    return this.findOne(menuId);
  }

  async updateItem(menuId: string, itemId: string, dto: UpdateMenuItemDto): Promise<MenuResponse> {
    const item = await this.ensureMenuItem(menuId, itemId);

    if (item.isRoot) {
      if (dto.title) {
        return this.update(menuId, { name: dto.title });
      }
      return this.findOne(menuId);
    }

    if (dto.parentId !== undefined) {
      const targetParent =
        dto.parentId === null
          ? await this.getRootItem(menuId)
          : await this.ensureMenuItem(menuId, dto.parentId);
      const targetParentId = targetParent.id;

      if (targetParentId === itemId) {
        throw new BadRequestException('Item cannot be its own parent');
      }

      if (targetParentId !== item.parentId) {
        await this.assertNoCycle(menuId, itemId, targetParentId);

        await this.prisma.$transaction(async (tx) => {
          await tx.menuItem.updateMany({
            where: {
              menuId,
              parentId: item.parentId,
              order: { gt: item.order },
            },
            data: { order: { decrement: 1 } },
          });

          const order = await this.nextOrder(menuId, targetParentId, tx);

          await tx.menuItem.update({
            where: { id: itemId },
            data: {
              parentId: targetParentId,
              order,
            },
          });
        });
      }
    }

    if (dto.title) {
      await this.prisma.menuItem.update({
        where: { id: itemId },
        data: { title: dto.title },
      });
    }

    return this.findOne(menuId);
  }

  async removeItem(menuId: string, itemId: string): Promise<MenuResponse> {
    const item = await this.ensureMenuItem(menuId, itemId);

    if (item.isRoot) {
      throw new BadRequestException('Cannot delete the root item');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.menuItem.delete({ where: { id: itemId } });

      await tx.menuItem.updateMany({
        where: {
          menuId,
          parentId: item.parentId,
          order: { gt: item.order },
        },
        data: { order: { decrement: 1 } },
      });
    });

    return this.findOne(menuId);
  }

  private mapMenu(menu: Menu, root: MenuTreeNode | null, depth: number): MenuResponse {
    return {
      id: menu.id,
      name: menu.name,
      depth,
      createdAt: menu.createdAt.toISOString(),
      updatedAt: menu.updatedAt.toISOString(),
      rootItem: root,
    };
  }

  private buildTree(items: MenuItem[], depthLimit?: number) {
    if (!items.length) {
      return { root: null as MenuTreeNode | null, depth: 0 };
    }

    const nodes = new Map<string, MenuTreeNode>();

    for (const item of items) {
      nodes.set(item.id, {
        id: item.id,
        menuId: item.menuId,
        parentId: item.parentId,
        title: item.title,
        order: item.order,
        isRoot: item.isRoot,
        depth: 0,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        children: [],
      });
    }

    let root: MenuTreeNode | null = null;

    const sorted = [...items].sort((a, b) => a.order - b.order);

    for (const item of sorted) {
      const node = nodes.get(item.id)!;
      if (item.parentId) {
        const parent = nodes.get(item.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        root = node;
      }
    }

    const assignDepth = (node: MenuTreeNode | null, current: number): number => {
      if (!node) {
        return current;
      }

      node.depth = current;

      if (depthLimit !== undefined && current >= depthLimit) {
        node.children = [];
        return current;
      }

      node.children.sort((a, b) => a.order - b.order);

      let maxDepth = current;
      for (const child of node.children) {
        maxDepth = Math.max(maxDepth, assignDepth(child, current + 1));
      }

      return maxDepth;
    };

    const depth = assignDepth(root, 0);
    return { root, depth };
  }

  private async getRootItem(
    menuId: string,
    client: Prisma.TransactionClient | PrismaClient = this.prisma,
  ) {
    const root = await client.menuItem.findFirst({
      where: { menuId, isRoot: true },
    });

    if (!root) {
      throw new NotFoundException(`Root item for menu ${menuId} not found`);
    }

    return root;
  }

  private async ensureMenuItem(menuId: string, itemId: string) {
    const item = await this.prisma.menuItem.findFirst({ where: { id: itemId, menuId } });

    if (!item) {
      throw new NotFoundException(`Menu item ${itemId} not found`);
    }

    return item;
  }

  private async assertNoCycle(menuId: string, itemId: string, newParentId: string | null) {
    if (!newParentId) {
      return;
    }

    const ancestry = await this.prisma.menuItem.findMany({
      where: { menuId },
      select: { id: true, parentId: true },
    });

    const parentById = new Map(ancestry.map((entry) => [entry.id, entry.parentId]));

    let current: string | null = newParentId;

    while (current) {
      if (current === itemId) {
        throw new BadRequestException('Cannot move an item inside its descendants');
      }

      current = parentById.get(current) ?? null;
    }
  }

  private async nextOrder(
    menuId: string,
    parentId: string | null,
    client: Prisma.TransactionClient | PrismaClient = this.prisma,
  ) {
    const last = await client.menuItem.findFirst({
      where: { menuId, parentId },
      orderBy: { order: 'desc' },
    });

    return (last?.order ?? -1) + 1;
  }
}
