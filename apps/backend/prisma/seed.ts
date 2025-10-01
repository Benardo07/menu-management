import { config } from 'dotenv';
import { resolve } from 'path';

const envPath = resolve(__dirname, '../.env');
console.log(`Seeding using env file: ${envPath}`);
config({ path: envPath });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not found for seeding');
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

async function seedSystemManagementMenu() {
  const slug = 'system-management';
  const existing = await prisma.menu.findUnique({ where: { slug } });

  if (existing) {
    await prisma.menu.delete({ where: { id: existing.id } });
  }

  const menu = await prisma.menu.create({
    data: {
      name: 'System Management',
      slug,
    },
  });

  const root = await prisma.menuItem.create({
    data: {
      menuId: menu.id,
      title: 'System Management',
      slug,
      isRoot: true,
      order: 0,
    },
  });

  const systems = await prisma.menuItem.create({
    data: {
      menuId: menu.id,
      parentId: root.id,
      title: 'Systems',
      slug: 'systems',
      order: 0,
    },
  });

  const systemCode = await prisma.menuItem.create({
    data: {
      menuId: menu.id,
      parentId: systems.id,
      title: 'System Code',
      slug: 'system-code',
      order: 0,
    },
  });

  await prisma.menuItem.createMany({
    data: [
      {
        menuId: menu.id,
        parentId: systemCode.id,
        title: 'Code Registration',
        slug: 'code-registration',
        order: 0,
      },
      {
        menuId: menu.id,
        parentId: systemCode.id,
        title: 'Code Registration - 2',
        slug: 'code-registration-2',
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
        slug: 'properties',
        order: 1,
      },
      {
        menuId: menu.id,
        parentId: systems.id,
        title: 'Menus',
        slug: 'menus',
        order: 2,
      },
      {
        menuId: menu.id,
        parentId: systems.id,
        title: 'API List',
        slug: 'api-list',
        order: 3,
      },
      {
        menuId: menu.id,
        parentId: systems.id,
        title: 'Users & Groups',
        slug: 'users-groups',
        order: 4,
      },
    ],
  });

  const menusNode = await prisma.menuItem.findFirst({
    where: { menuId: menu.id, slug: 'menus' },
  });

  if (menusNode) {
    await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        parentId: menusNode.id,
        title: 'Menu Registration',
        slug: 'menu-registration',
        order: 0,
      },
    });
  }

  const apiListNode = await prisma.menuItem.findFirst({
    where: { menuId: menu.id, slug: 'api-list' },
  });

  if (apiListNode) {
    await prisma.menuItem.createMany({
      data: [
        {
          menuId: menu.id,
          parentId: apiListNode.id,
          title: 'API Registration',
          slug: 'api-registration',
          order: 0,
        },
        {
          menuId: menu.id,
          parentId: apiListNode.id,
          title: 'API Edit',
          slug: 'api-edit',
          order: 1,
        },
      ],
    });
  }

  const usersGroupsNode = await prisma.menuItem.findFirst({
    where: { menuId: menu.id, slug: 'users-groups' },
  });

  if (usersGroupsNode) {
    const usersNode = await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        parentId: usersGroupsNode.id,
        title: 'Users',
        slug: 'users',
        order: 0,
      },
    });

    const groupsNode = await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        parentId: usersGroupsNode.id,
        title: 'Groups',
        slug: 'groups',
        order: 1,
      },
    });

    const approvalsNode = await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        parentId: usersGroupsNode.id,
        title: 'Approvals',
        slug: 'approvals',
        order: 2,
      },
    });

    await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        parentId: usersNode.id,
        title: 'User Account Registration',
        slug: 'user-account-registration',
        order: 0,
      },
    });

    await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        parentId: groupsNode.id,
        title: 'User Group Registration',
        slug: 'user-group-registration',
        order: 0,
      },
    });

    await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        parentId: approvalsNode.id,
        title: 'Approval Detail',
        slug: 'approval-detail',
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
