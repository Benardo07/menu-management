import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

const envPath = resolve(__dirname, '../.env');
console.log(`Seeding using env file: ${envPath}`);
config({ path: envPath });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not found for seeding');
}

const prisma = new PrismaClient();

async function seedSystemManagementMenu() {
  const existing = await prisma.menu.findFirst({ where: { name: 'System Management' } });

  if (existing) {
    await prisma.menu.delete({ where: { id: existing.id } });
  }

  const menu = await prisma.menu.create({
    data: {
      name: 'System Management',
    },
  });

  const root = await prisma.menuItem.create({
    data: {
      menuId: menu.id,
      title: 'System Management',
      isRoot: true,
      order: 0,
    },
  });

  const systems = await prisma.menuItem.create({
    data: {
      menuId: menu.id,
      parentId: root.id,
      title: 'Systems',
      order: 0,
    },
  });

  const systemCode = await prisma.menuItem.create({
    data: {
      menuId: menu.id,
      parentId: systems.id,
      title: 'System Code',
      order: 0,
    },
  });

  await prisma.menuItem.createMany({
    data: [
      {
        menuId: menu.id,
        parentId: systemCode.id,
        title: 'Code Registration',
        order: 0,
      },
      {
        menuId: menu.id,
        parentId: systemCode.id,
        title: 'Code Registration - 2',
        order: 1,
      },
    ],
  });

  await prisma.menuItem.createMany({
    data: [
      {
        menuId: menu.id,
        parentId: systems.id,
        title: 'Properties',
        order: 1,
      },
      {
        menuId: menu.id,
        parentId: systems.id,
        title: 'Menus',
        order: 2,
      },
      {
        menuId: menu.id,
        parentId: systems.id,
        title: 'API List',
        order: 3,
      },
      {
        menuId: menu.id,
        parentId: systems.id,
        title: 'Users & Groups',
        order: 4,
      },
    ],
  });

  const menuNode = await prisma.menuItem.findFirst({
    where: { menuId: menu.id, parentId: systems.id, title: 'Menus' },
  });

  if (menuNode) {
    await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        parentId: menuNode.id,
        title: 'Menu Registration',
        order: 0,
      },
    });
  }

  const apiListNode = await prisma.menuItem.findFirst({
    where: { menuId: menu.id, parentId: systems.id, title: 'API List' },
  });

  if (apiListNode) {
    await prisma.menuItem.createMany({
      data: [
        {
          menuId: menu.id,
          parentId: apiListNode.id,
          title: 'API Registration',
          order: 0,
        },
        {
          menuId: menu.id,
          parentId: apiListNode.id,
          title: 'API Edit',
          order: 1,
        },
      ],
    });
  }

  const usersGroupsNode = await prisma.menuItem.findFirst({
    where: { menuId: menu.id, parentId: systems.id, title: 'Users & Groups' },
  });

  if (usersGroupsNode) {
    const usersNode = await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        parentId: usersGroupsNode.id,
        title: 'Users',
        order: 0,
      },
    });

    const groupsNode = await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        parentId: usersGroupsNode.id,
        title: 'Groups',
        order: 1,
      },
    });

    const approvalsNode = await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        parentId: usersGroupsNode.id,
        title: 'Approvals',
        order: 2,
      },
    });

    await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        parentId: usersNode.id,
        title: 'User Account Registration',
        order: 0,
      },
    });

    await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        parentId: groupsNode.id,
        title: 'User Group Registration',
        order: 0,
      },
    });

    await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        parentId: approvalsNode.id,
        title: 'Approval Detail',
        order: 0,
      },
    });
  }
}

async function main() {
  await seedSystemManagementMenu();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
