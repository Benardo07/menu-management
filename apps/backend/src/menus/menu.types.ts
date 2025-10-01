export interface MenuTreeNode {
  id: string;
  menuId: string;
  parentId: string | null;
  title: string;
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
  depth: number;
  createdAt: string;
  updatedAt: string;
  rootItem: MenuTreeNode | null;
}
