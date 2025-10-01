"use client";

import { useEffect, useMemo, useState } from "react";
import { Dot, Folder, ChevronRight } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { TreeView, type TreeNode } from "@/components/tree/tree-view";
import { MenuForm, type MenuFormValues } from "@/components/menus/menu-form";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  createMenuItem,
  deleteMenuItem,
  fetchMenuById,
  fetchMenus,
  selectItem,
  selectMenu,
  type MenuPayload,
  type MenuTreeNode,
  updateMenuItem,
} from "@/lib/redux/slices/menu-slice";

export default function MenusPage() {
  const dispatch = useAppDispatch();
  const menus = useAppSelector((state) => state.menus);
  const { list, entities, selectedMenuId, selectedItemId, loading, saving, error } = menus;
  const [allExpanded, setAllExpanded] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!list.length) {
      dispatch(fetchMenus());
    }
  }, [dispatch, list.length]);

  useEffect(() => {
    if (selectedMenuId) {
      dispatch(fetchMenuById(selectedMenuId));
    }
  }, [dispatch, selectedMenuId]);

  useEffect(() => {
    setAllExpanded(true);
  }, [selectedMenuId]);

  const selectedMenu = selectedMenuId ? entities[selectedMenuId] : null;

  const { treeNodes, nodeById, parentById } = useMemo(() => {
    if (!selectedMenu?.rootItem) {
      return { treeNodes: [] as TreeNode[], nodeById: new Map<string, MenuTreeNode>(), parentById: new Map<string, string | null>() };
    }

    const nodeMap = new Map<string, MenuTreeNode>();
    const parentMap = new Map<string, string | null>();

    const toTreeNode = (item: MenuTreeNode, parentId: string | null): TreeNode => {
      nodeMap.set(item.id, item);
      parentMap.set(item.id, parentId);
      return {
        id: item.id,
        label: item.title,
        canAdd: true,
        canDelete: !item.isRoot,
        data: { node: item },
        children: item.children?.map((child) => toTreeNode(child, item.id)) ?? [],
      };
    };

    const rootNode = toTreeNode(selectedMenu.rootItem, null);
    return { treeNodes: [rootNode], nodeById: nodeMap, parentById: parentMap };
  }, [selectedMenu]);

  const selectedItem = selectedItemId ? nodeById.get(selectedItemId) ?? null : selectedMenu?.rootItem ?? null;
  const parentItemId = selectedItem ? parentById.get(selectedItem.id) ?? null : null;
  const parentItem = parentItemId ? nodeById.get(parentItemId) ?? null : null;

  const handleMenuChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const menuId = event.target.value || null;
    dispatch(selectMenu(menuId));
  };

  const handleSelectNode = (node: TreeNode) => {
    dispatch(selectItem(node.id));
  };

  const handleAddNode = async (node: TreeNode) => {
    if (!selectedMenuId) return;
    setLocalError(null);
    try {
      const updatedMenu = await dispatch(
        createMenuItem({ menuId: selectedMenuId, parentId: node.id, title: "New Item" }),
      ).unwrap();
      const newestChild = findNewestChild(updatedMenu, node.id);
      if (newestChild) {
        dispatch(selectItem(newestChild.id));
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
    const fallback = parentById.get(node.id) ?? selectedMenu?.rootItem?.id ?? null;
    try {
      await dispatch(deleteMenuItem({ menuId: selectedMenuId, itemId: node.id })).unwrap();
      dispatch(selectItem(fallback ?? null));
    } catch (err) {
      setLocalError((err as Error).message);
    }
  };

  const handleSaveItem = async (values: MenuFormValues) => {
    if (!selectedMenuId || !selectedItemId) return;
    setLocalError(null);
    try {
      await dispatch(
        updateMenuItem({
          menuId: selectedMenuId,
          itemId: selectedItemId,
          title: values.title,
          slug: values.slug ?? null,
          url: values.url ?? null,
        }),
      ).unwrap();
    } catch (err) {
      setLocalError((err as Error).message);
    }
  };

  const handleDeleteFromForm = async () => {
    if (!selectedMenuId || !selectedItem || selectedItem.isRoot) return;
    setLocalError(null);
    const fallback = parentById.get(selectedItem.id) ?? selectedMenu?.rootItem?.id ?? null;
    try {
      await dispatch(deleteMenuItem({ menuId: selectedMenuId, itemId: selectedItem.id })).unwrap();
      dispatch(selectItem(fallback ?? null));
    } catch (err) {
      setLocalError((err as Error).message);
    }
  };

  const isHydrating = loading && !selectedMenu;
  const feedback = localError || error;

  return (
    <div className="min-h-dvh bg-white">
      <AppSidebar />
      <TopBar />

      <main className="md:pl-72">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-8 md:py-10">
          <header className="mb-6 space-y-6">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Folder className="h-4 w-4 text-slate-400" aria-hidden />
              <span className="text-slate-400">/</span>
              <span className="text-slate-600">Menus</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white">
                <Dot className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                  Menus
                </h1>
                <p className="text-sm text-slate-500">Manage nested navigation structures with ease.</p>
              </div>
            </div>
          </header>

          <section className="mb-6 grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div className="max-w-sm">
              <label className="mb-2 block text-sm text-slate-600">Menu</label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-800 shadow-sm outline-none ring-0 transition focus:border-slate-300"
                  value={selectedMenuId ?? ""}
                  onChange={handleMenuChange}
                  disabled={!list.length}
                >
                  {!list.length && <option value="">Loading...</option>}
                  {list.map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {menu.name}
                    </option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setAllExpanded(true)}
                className={cn(
                  "rounded-full px-5",
                  "bg-slate-900 text-white hover:bg-slate-900/90",
                )}
              >
                Expand All
              </Button>
              <Button
                onClick={() => setAllExpanded(false)}
                variant="outline"
                className={cn(
                  "rounded-full px-5",
                  "border-slate-200 text-slate-700 hover:bg-slate-100",
                )}
              >
                Collapse All
              </Button>
            </div>

            {feedback && (
              <span className="text-sm text-red-600">{feedback}</span>
            )}
          </section>

          <div className="grid gap-10 lg:grid-cols-[minmax(320px,1fr)_minmax(320px,480px)]">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 md:p-6">
              {isHydrating ? (
                <LoadingState />
              ) : treeNodes.length ? (
                <TreeView
                  nodes={treeNodes}
                  allExpanded={allExpanded}
                  onAdd={handleAddNode}
                  onDelete={handleDeleteNode}
                  onSelect={handleSelectNode}
                  selectedId={selectedItem?.id ?? null}
                />
              ) : (
                <EmptyState />
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 md:p-6">
              <MenuForm
                menu={selectedMenu}
                item={selectedItem}
                parent={parentItem}
                saving={saving}
                onSubmit={handleSaveItem}
                onDelete={handleDeleteFromForm}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function findNewestChild(menu: MenuPayload, parentId: string) {
  const stack: MenuTreeNode[] = menu.rootItem ? [menu.rootItem] : [];
  while (stack.length) {
    const node = stack.pop()!;
    if (node.id === parentId) {
      if (!node.children?.length) return null;
      return [...node.children].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
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
        Create a new menu item using the blue buttons in the tree to start building your navigation hierarchy.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-10 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}


