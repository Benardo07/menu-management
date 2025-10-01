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
    const slug = await this.generateUniqueMenuSlug(dto.name);

    const menuId = await this.prisma.$transaction(async (tx) => {
      const menu = await tx.menu.create({
        data: {
          name: dto.name,
          slug,
        },
      });

      await tx.menuItem.create({
        data: {
          menuId: menu.id,
          title: dto.name,
          slug,
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

    let nextSlug = menu.slug;

    if (dto.name && dto.name !== menu.name) {
      nextSlug = await this.generateUniqueMenuSlug(dto.name, menu.id);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.menu.update({
        where: { id },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(nextSlug !== menu.slug ? { slug: nextSlug } : {}),
        },
      });

      if (dto.name) {
        const root = await tx.menuItem.findFirst({ where: { menuId: id, isRoot: true } });

        if (root) {
          await tx.menuItem.update({
            where: { id: root.id },
            data: {
              title: dto.name,
              slug: nextSlug,
            },
          });
        }
      }
    });

    return this.findOne(id);
  }

  async createItem(menuId: string, dto: CreateMenuItemDto): Promise<MenuResponse> {
    const parent = await this.ensureMenuItem(menuId, dto.parentId);

    const order = await this.nextOrder(menuId, parent.id);
    const slug = await this.generateUniqueMenuItemSlug(menuId, dto.slug ?? dto.title);

    await this.prisma.menuItem.create({
      data: {
        menuId,
        parentId: parent.id,
        title: dto.title,
        slug,
        url: dto.url ?? null,
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

    if (dto.parentId !== undefined && dto.parentId !== item.parentId) {
      if (dto.parentId === null) {
        throw new BadRequestException('Parent cannot be null');
      }

      const newParent = await this.ensureMenuItem(menuId, dto.parentId);
      await this.assertNoCycle(menuId, itemId, newParent.id);

      await this.prisma.$transaction(async (tx) => {
        await tx.menuItem.updateMany({
          where: {
            menuId,
            parentId: item.parentId,
            order: { gt: item.order },
          },
          data: { order: { decrement: 1 } },
        });

        const order = await this.nextOrder(menuId, newParent.id, tx);

        await tx.menuItem.update({
          where: { id: itemId },
          data: {
            parentId: newParent.id,
            order,
          },
        });
      });
    }

    const data: Prisma.MenuItemUpdateInput = {};

    if (dto.title) {
      data.title = dto.title;
    }

    if (dto.slug !== undefined) {
      const slugBase = dto.slug ?? dto.title ?? item.title;
      data.slug = await this.generateUniqueMenuItemSlug(menuId, slugBase, itemId);
    } else if (dto.title) {
      data.slug = await this.generateUniqueMenuItemSlug(menuId, dto.title, itemId);
    }

    if (dto.url !== undefined) {
      data.url = dto.url ?? null;
    }

    if (Object.keys(data).length) {
      await this.prisma.menuItem.update({ where: { id: itemId }, data });
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
      slug: menu.slug,
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
        slug: item.slug,
        url: item.url,
        order: item.order,
        isRoot: item.isRoot,
        depth: 0,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        children: [],
      });
    }

    let root: MenuTreeNode | null = null;

    const sorted = [...items].sort((a, b) => {
      if ((a.parentId ?? '') !== (b.parentId ?? '')) {
        return (a.parentId ?? '').localeCompare(b.parentId ?? '');
      }
      return a.order - b.order;
    });

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

  private async ensureMenuItem(menuId: string, itemId: string) {
    const item = await this.prisma.menuItem.findFirst({ where: { id: itemId, menuId } });

    if (!item) {
      throw new NotFoundException(`Menu item ${itemId} not found`);
    }

    return item;
  }

  private async assertNoCycle(menuId: string, itemId: string, newParentId: string) {
    let current: MenuItem | null = await this.prisma.menuItem.findFirst({
      where: { id: newParentId, menuId },
    });

    while (current) {
      if (current.id === itemId) {
        throw new BadRequestException('Cannot move an item inside its descendants');
      }
      if (!current.parentId) {
        break;
      }
      current = await this.prisma.menuItem.findFirst({
        where: { id: current.parentId, menuId },
      });
    }
  }

  private async generateUniqueMenuSlug(name: string, excludeId?: string): Promise<string> {
    const base = this.slugify(name);
    let slug = base;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.menu.findFirst({
        where: {
          slug,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
      });

      if (!existing) {
        return slug;
      }

      slug = `${base}-${counter}`;
      counter += 1;
    }
  }

  private async generateUniqueMenuItemSlug(menuId: string, value: string, excludeId?: string): Promise<string> {
    const base = this.slugify(value);
    let slug = base;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.menuItem.findFirst({
        where: {
          menuId,
          slug,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
      });

      if (!existing) {
        return slug;
      }

      slug = `${base}-${counter}`;
      counter += 1;
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

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }
}
