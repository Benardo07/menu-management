export interface MenuTreeNode {
  id: string;
  menuId: string;
  parentId: string | null;
  title: string;
  slug: string | null;
  url: string | null;
  order: number;
  depth: number;
  isRoot: boolean;
  createdAt: string;
  updatedAt: string;
  children: MenuTreeNode[];
}

export interface MenuResponse {
  id: string;
  name: string;
  slug: string;
  depth: number;
  createdAt: string;
  updatedAt: string;
  rootItem: MenuTreeNode | null;
}
