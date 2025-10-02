"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { ChevronRight, Folder } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { TreeView, type TreeNode } from "@/components/tree/tree-view";
import { MenuForm, type MenuFormValues } from "@/components/menus/menu-form";
import { ComingSoon } from "@/components/coming-soon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { cn, slugify } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  createMenuItem,
  deleteMenuItem,
  fetchMenuById,
  fetchMenus,
  selectMenu,
  selectItem,
  type MenuPayload,
  type MenuTreeNode,
  updateMenuItem,
} from "@/lib/redux/slices/menu-slice";
import { useSidebar } from "@/contexts/sidebar-context";
import { SubmenuIcon } from "@/components/icons/submenu-icon";

const DEFAULT_NEW_ITEM_TITLE = "New Item";
export type MenusScreenProps = {
  slugSegments?: string[];
  basePath?: string;
};

export function MenusScreen({ slugSegments = [], basePath }: MenusScreenProps = {}) {
  const dispatch = useAppDispatch();
  const { collapsed } = useSidebar();
  const { showToast } = useToast();

  const menus = useAppSelector((state) => state.menus);
  const {
    list,
    entities,
    selectedMenuId,
    selectedItemId,
    loading,
    saving,
    error,
  } = menus;

  const [allExpanded, setAllExpanded] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editorSelectedItemId, setEditorSelectedItemId] = useState<
    string | null
  >(null);
  const [currentRootItemId, setCurrentRootItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!list.length) {
      dispatch(fetchMenus());
    }
  }, [dispatch, list.length]);

  useEffect(() => {
    if (!selectedMenuId && list.length) {
      dispatch(selectMenu(list[0].id));
    }
  }, [dispatch, list, selectedMenuId]);

  useEffect(() => {
    if (!selectedMenuId) {
      return;
    }
    if (entities[selectedMenuId]?.rootItem) {
      return;
    }
    dispatch(fetchMenuById(selectedMenuId));
  }, [dispatch, selectedMenuId, entities]);

  useEffect(() => {
    setAllExpanded(true);
  }, [selectedMenuId, currentRootItemId]);

  const selectedMenu = selectedMenuId ? entities[selectedMenuId] : null;
  const normalizedSlugSegments = useMemo(() => (slugSegments ?? []).map((segment) => slugify(segment)), [slugSegments]);
  const baseBreadcrumb = basePath ? `/${basePath}` : "";

  const menuMaps = useMemo(() => {
    if (!selectedMenu?.rootItem) {
      return {
        treeNodes: [] as TreeNode[],
        nodeById: new Map<string, MenuTreeNode>(),
        parentById: new Map<string, string | null>(),
        treeNodeById: new Map<string, TreeNode>(),
      };
    }

    const nodeById = new Map<string, MenuTreeNode>();
    const parentById = new Map<string, string | null>();
    const treeNodeById = new Map<string, TreeNode>();

    const toTreeNode = (
      item: MenuTreeNode,
      parentId: string | null,
      depth: number,
    ): TreeNode => {
      nodeById.set(item.id, item);
      parentById.set(item.id, parentId);

      const treeNode: TreeNode = {
        id: item.id,
        label: item.title,
        depth,
        canAdd: true,
        canDelete: !item.isRoot,
        data: { node: item },
        children:
          item.children?.map((child) =>
            toTreeNode(child, item.id, depth + 1)
          ) ?? [],
      };

      treeNodeById.set(item.id, treeNode);

      return treeNode;
    };

    const rootNode = toTreeNode(selectedMenu.rootItem, null, 0);

    return {
      treeNodes: [rootNode],
      nodeById,
      parentById,
      treeNodeById,
    };
  }, [selectedMenu]);

  const { treeNodes, nodeById, parentById, treeNodeById } = menuMaps;
  useEffect(() => {
    if (!normalizedSlugSegments.length || !list.length) {
      return;
    }

    const menuSlug = normalizedSlugSegments[0];
    const targetMenu = list.find((menu) => slugify(menu.name) === menuSlug);
    if (targetMenu && targetMenu.id !== selectedMenuId) {
      dispatch(selectMenu(targetMenu.id));
    }
  }, [dispatch, list, normalizedSlugSegments, selectedMenuId]);
  const sidebarSelectedItemId = selectedItemId;
  const defaultRootId = selectedMenu?.rootItem?.id ?? null;

  useEffect(() => {
    if (!defaultRootId) {
      setCurrentRootItemId(null);
      return;
    }
    setCurrentRootItemId((current) =>
      current && treeNodeById.get(current) ? current : defaultRootId
    );
  }, [defaultRootId, treeNodeById]);

  const resolvedRootNode =
    (currentRootItemId && treeNodeById.get(currentRootItemId)) ||
    (defaultRootId && treeNodeById.get(defaultRootId)) ||
    treeNodes[0] ||
    null;
  useEffect(() => {
    if (normalizedSlugSegments.length <= 1 || !selectedMenu?.rootItem) {
      return;
    }

    const [, ...itemSegments] = normalizedSlugSegments;
    if (!itemSegments.length) {
      return;
    }

    const match = findNodeBySlug(selectedMenu.rootItem, itemSegments);
    if (!match) {
      return;
    }

    setEditorSelectedItemId((current) => (current === match.id ? current : match.id));
    dispatch(selectItem(match.id));
  }, [dispatch, normalizedSlugSegments, selectedMenu]);

  useEffect(() => {
    if (!resolvedRootNode) {
      setEditorSelectedItemId(null);
      return;
    }
    setEditorSelectedItemId((current) =>
      current && treeNodeById.get(current)
        ? current
        : resolvedRootNode.children?.[0]?.id ?? resolvedRootNode.id
    );
  }, [resolvedRootNode, treeNodeById]);

  const selectedItemRaw = editorSelectedItemId
    ? nodeById.get(editorSelectedItemId) ?? null
    : null;
  const selectedItem = selectedItemRaw ?? selectedMenu?.rootItem ?? null;
  const parentItemId = selectedItem
    ? parentById.get(selectedItem.id) ?? null
    : null;
  const parentItem = parentItemId ? nodeById.get(parentItemId) ?? null : null;
  const breadcrumbItem = sidebarSelectedItemId
    ? nodeById.get(sidebarSelectedItemId) ?? null
    : selectedMenu?.rootItem ?? null;

  const displayNodes = resolvedRootNode ? [resolvedRootNode] : treeNodes;

  const itemOptions = useMemo(() => {
    if (!selectedMenu?.rootItem) {
      return [];
    }
    const options: { id: string; title: string; depth: number }[] = [];
    const walk = (node: MenuTreeNode, depth: number) => {
      options.push({ id: node.id, title: node.title, depth });
      node.children?.forEach((child) => walk(child, depth + 1));
    };
    walk(selectedMenu.rootItem, 0);
    return options;
  }, [selectedMenu]);

  const duplicateExists = (
    parentId: string | null,
    title: string,
    excludeId?: string
  ) => {
    const normalized = title.trim().toLowerCase();
    if (!normalized) {
      return false;
    }
    const parentNode = parentId
      ? nodeById.get(parentId)
      : selectedMenu?.rootItem ?? null;
    const siblings = parentNode?.children ?? [];
    return siblings.some(
      (child) =>
        child.id !== excludeId &&
        child.title.trim().toLowerCase() === normalized
    );
  };

  const breadcrumbLabel = useMemo(() => {
    if (!breadcrumbItem || breadcrumbItem.isRoot || (breadcrumbItem.depth ?? 0) <= 2) {
      return baseBreadcrumb;
    }
    return `${baseBreadcrumb} / ${breadcrumbItem.title}`;
  }, [baseBreadcrumb, breadcrumbItem]);


  const handleSelectNode = (node: TreeNode) => {
    setEditorSelectedItemId(node.id);
    setMobileOpen(false);
  };

  const handleRootChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value || null;
    setCurrentRootItemId(value);
    setAllExpanded(false);
  };

  const handleAddNode = async (node: TreeNode) => {
    if (!selectedMenuId) return;

    const siblings = node.children ?? [];
    if (
      siblings.some(
        (child) =>
          child.label.trim().toLowerCase() ===
          DEFAULT_NEW_ITEM_TITLE.toLowerCase()
      )
    ) {
      showToast({
        title: "Duplicate name",
        description: `A submenu named "${DEFAULT_NEW_ITEM_TITLE}" already exists here. Rename it before adding another.`,
        variant: "error",
      });
      return;
    }

    setLocalError(null);
    try {
      const updatedMenu = await dispatch(
        createMenuItem({
          menuId: selectedMenuId,
          parentId: node.id,
          title: DEFAULT_NEW_ITEM_TITLE,
        })
      ).unwrap();
      const newestChild = findNewestChild(updatedMenu, node.id);
      if (newestChild) {
        setEditorSelectedItemId(newestChild.id);
      }
      setAllExpanded(true);
    } catch (err) {
      setLocalError((err as Error).message);
    }
  };

  const handleDeleteNode = async (node: TreeNode) => {
    if (!selectedMenuId || node.id === selectedMenu?.rootItem?.id) {
      return;
    }
    setLocalError(null);
    const fallback =
      parentById.get(node.id) ?? selectedMenu?.rootItem?.id ?? null;
    try {
      await dispatch(
        deleteMenuItem({ menuId: selectedMenuId, itemId: node.id })
      ).unwrap();
      setEditorSelectedItemId(fallback ?? null);
    } catch (err) {
      setLocalError((err as Error).message);
    }
  };

  const handleSaveItem = async (values: MenuFormValues) => {
    if (!selectedMenuId || !editorSelectedItemId || !selectedItem) return;

    const nextTitle = values.title.trim();
    if (!nextTitle.length) {
      showToast({
        title: "Name required",
        description: "Please enter a menu name before saving.",
        variant: "error",
      });
      return;
    }

    const parentId = parentById.get(editorSelectedItemId) ?? null;
    if (duplicateExists(parentId, nextTitle, editorSelectedItemId)) {
      showToast({
        title: "Duplicate name",
        description:
          "Another submenu with this name already exists in this folder.",
        variant: "error",
      });
      return;
    }

    setLocalError(null);
    try {
      await dispatch(
        updateMenuItem({
          menuId: selectedMenuId,
          itemId: editorSelectedItemId,
          title: nextTitle,
        })
      ).unwrap();
    } catch (err) {
      setLocalError((err as Error).message);
    }
  };

  const handleDeleteFromForm = async () => {
    if (!selectedMenuId || !selectedItem || selectedItem.isRoot) return;
    setLocalError(null);
    const fallback =
      parentById.get(selectedItem.id) ?? selectedMenu?.rootItem?.id ?? null;
    try {
      await dispatch(
        deleteMenuItem({ menuId: selectedMenuId, itemId: selectedItem.id })
      ).unwrap();
      setEditorSelectedItemId(fallback ?? null);
    } catch (err) {
      setLocalError((err as Error).message);
    }
  };

  const isHydrating = loading && !selectedMenu;
  const feedback = localError || error;

  const panelContent = selectedItem ? (
    <MenuForm
      menu={selectedMenu}
      item={selectedItem}
      parent={parentItem}
      saving={saving}
      onSubmit={handleSaveItem}
      onDelete={handleDeleteFromForm}
    />
  ) : (
    <ComingSoon title="Select a menu item" />
  );

  return (
    <div className="min-h-dvh bg-white">
      <AppSidebar mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />

      <main
        className={cn(
          "transition-all duration-300",
          collapsed ? "md:pl-28" : "md:pl-[21rem]"
        )}
      >
        <TopBar onMenuToggle={() => setMobileOpen((open) => !open)} />
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-8 md:py-10">
          <header className="mb-6 space-y-6">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-sm text-slate-500"
            >
              <Folder className="h-4 w-4 text-slate-400" aria-hidden />
              <span className="flex items-center gap-2 text-slate-600">
                {breadcrumbLabel}
              </span>
            </nav>

            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#253BFF] text-white">
                <SubmenuIcon className="h-6 w-6" fill="#FFFFFF" />
              </div>
              <div>
                <h1 className="text-2xl  tracking-tight text-slate-900 md:text-3xl font-bold">
                  Menus
                </h1>
              </div>
            </div>
          </header>

          <section className="mb-6 grid gap-4 md:grid-cols-[minmax(240px,0.4fr)_minmax(240px,0.4fr)_auto] md:items-center">
            <div className="max-w-sm">
              <label className="mb-2 block text-sm text-slate-600">Menu</label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-800 shadow-sm outline-none ring-0 transition focus:border-slate-300"
                  value={currentRootItemId ?? defaultRootId ?? ""}
                  onChange={handleRootChange}
                  disabled={!itemOptions.length}
                >
                  {itemOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {`${item.title}`}
                    </option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setAllExpanded(true)}
                className="rounded-full bg-slate-900 px-5 text-white hover:bg-slate-900/90"
              >
                Expand All
              </Button>
              <Button
                onClick={() => setAllExpanded(false)}
                variant="outline"
                className="rounded-full border-slate-200 px-5 text-slate-700 hover:bg-slate-100"
              >
                Collapse All
              </Button>
            </div>

            {feedback && (
              <span className="text-sm text-red-600">{feedback}</span>
            )}
          </section>

          <div className="grid gap-10 lg:grid-cols-[0.6fr_0.4fr] lg:items-start xl:grid-cols-[0.65fr_0.35fr]">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 md:p-6">
              {isHydrating ? (
                <LoadingState />
              ) : displayNodes.length ? (
                <TreeView
                  nodes={displayNodes}
                  allExpanded={allExpanded}
                  onAdd={handleAddNode}
                  onDelete={handleDeleteNode}
                  onSelect={handleSelectNode}
                  selectedId={editorSelectedItemId}
                />
              ) : (
                <EmptyState />
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 md:p-6">
              {panelContent}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function findNodeBySlug(root: MenuTreeNode, segments: string[]): MenuTreeNode | null {
  if (!segments.length) {
    return root;
  }

  const [current, ...rest] = segments;
  const next = root.children?.find((node) => slugify(node.title) === current);
  if (!next) {
    return null;
  }

  return findNodeBySlug(next, rest);
}

function findNewestChild(menu: MenuPayload, parentId: string) {
  const stack: MenuTreeNode[] = menu.rootItem ? [menu.rootItem] : [];
  while (stack.length) {
    const node = stack.pop()!;
    if (node.id === parentId) {
      if (!node.children?.length) return null;
      return [...node.children].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
    }
    node.children?.forEach((child) => stack.push(child));
  }
  return null;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-slate-500">
      <p className="text-base font-medium text-slate-700">No menu items yet</p>
      <p className="max-w-sm text-sm">
        Create a new menu item using the blue buttons in the tree to start
        building your navigation hierarchy.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-10 animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

