"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Folder as FolderIcon, Menu as MenuIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectItem } from "@/lib/redux/slices/menu-slice";
import type { MenuTreeNode } from "@/lib/redux/slices/menu-slice";
import { useSidebar } from "@/contexts/sidebar-context";

interface AppSidebarProps {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  slugById?: Record<string, string>;
  baseRoute?: string;
}

interface SidebarChild {
  id: string;
  title: string;
}

const SUBMENU_ICON = "/submenu.svg";

interface SidebarGroup {
  id: string;
  title: string;
  children: SidebarChild[];
  descendantIds: string[];
}

export function AppSidebar({ mobileOpen = false, onMobileOpenChange, slugById, baseRoute = "/menus" }: AppSidebarProps) {
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebar();
  const menus = useAppSelector((state) => state.menus);
  const dispatch = useAppDispatch();

  const selectedMenu = menus.selectedMenuId ? menus.entities[menus.selectedMenuId] : null;
  const selectedItemId = menus.selectedItemId ?? null;

  useEffect(() => {
    if (mobileOpen && collapsed) {
      setCollapsed(false);
    }
  }, [mobileOpen, collapsed, setCollapsed]);

  const groups = useMemo<SidebarGroup[]>(() => {
    if (!selectedMenu?.rootItem) {
      return [];
    }

    const gatherDescendants = (node: MenuTreeNode): string[] => {
      const ids = [node.id];
      node.children?.forEach((child) => {
        ids.push(...gatherDescendants(child));
      });
      return ids;
    };

    const levelOne = selectedMenu.rootItem.children ?? [];
    const result: SidebarGroup[] = [];

    levelOne.forEach((section) => {
      (section.children ?? []).forEach((child) => {
        result.push({
          id: child.id,
          title: child.title,
          children: child.children?.map((grandChild) => ({
            id: grandChild.id,
            title: grandChild.title,
          })) ?? [],
          descendantIds: gatherDescendants(child),
        });
      });
    });

    return result;
  }, [selectedMenu]);

  const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>([]);

  useEffect(() => {
    setExpandedGroupIds([]);
  }, [selectedMenu?.id]);

  useEffect(() => {
    setExpandedGroupIds((prev) => prev.filter((id) => groups.some((group) => group.id === id)));
  }, [groups]);

  useEffect(() => {
    if (!selectedItemId) {
      return;
    }
    const containingGroup = groups.find((group) => group.descendantIds.includes(selectedItemId));
    if (!containingGroup) {
      return;
    }
    setExpandedGroupIds((prev) => (prev.includes(containingGroup.id) ? prev : [...prev, containingGroup.id]));
  }, [groups, selectedItemId]);

  const handleCloseMobile = () => {
    onMobileOpenChange?.(false);
  };

  const handleOpenMobile = () => {
    onMobileOpenChange?.(true);
  };

  const handleGroupClick = (group: SidebarGroup) => {
    if (group.children.length === 0) {
      dispatch(selectItem(group.id));
      handleCloseMobile();
      return;
    }
    setExpandedGroupIds((prev) =>
      prev.includes(group.id) ? prev.filter((id) => id !== group.id) : [...prev, group.id],
    );
  };

  const handleChildClick = (childId: string) => {
    dispatch(selectItem(childId));
    const slug = slugById?.[childId];
    if (slug) {
      router.push(`/${slug}`, { scroll: false });
    } else if (baseRoute) {
      router.push(baseRoute, { scroll: false });
    }
    handleCloseMobile();
  };

  const sidebarContent = (
    <aside
      aria-label="Main navigation"
      className={cn(
        "flex h-full flex-col gap-6 text-slate-100 transition-all duration-300",
        collapsed ? "w-16 px-3 py-4" : "w-72 px-6 py-6",
      )}
    >
      <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}
>
        {!collapsed && <span className="text-lg font-semibold tracking-wide text-white">CLOIT</span>}
        <div className="flex items-center gap-2">
          {onMobileOpenChange && (
            <button
              type="button"
              onClick={handleCloseMobile}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:bg-white/10 md:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:bg-white/10"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <nav className="space-y-5 text-sm">
        {groups.length === 0 ? (
          <p className={cn("text-slate-400", collapsed ? "text-center text-xs" : "px-1")}>Select a menu to view items.</p>
        ) : (
          groups.map((group) => {
            const isExpanded = expandedGroupIds.includes(group.id);
            const isActiveGroup = selectedItemId ? group.descendantIds.includes(selectedItemId) : false;
            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() => handleGroupClick(group)}
                  className={cn(
                    "flex w-full items-center rounded-xl px-3 py-2 text-left font-medium transition",
                    collapsed ? "justify-center" : "gap-3",
                    isActiveGroup ? "bg-lime-400 text-slate-900" : "text-slate-200 hover:bg-white/10",
                  )}
                >
                  {!collapsed && (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform",
                        group.children.length > 0 ? "" : "opacity-0",
                        isExpanded && "rotate-90",
                      )}
                      aria-hidden
                    />
                  )}
                  <FolderIcon className={cn("h-4 w-4", collapsed ? "" : "text-current")} aria-hidden />
                  {!collapsed && <span>{group.title}</span>}
                </button>

                {!collapsed && group.children.length > 0 && isExpanded && (
                  <ul className="mt-2 space-y-1 pl-8 text-sm text-slate-300">
                    {group.children.map((child) => {
                      const isActiveChild = selectedItemId === child.id;
                      return (
                        <li key={child.id}>
                          <button
                            type="button"
                            onClick={() => handleChildClick(child.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2 transition",
                              isActiveChild ? "bg-white/15 text-white" : "hover:bg-white/5",
                            )}
                          >
                            <Image src={SUBMENU_ICON} alt="Sub menu" width={14} height={14} />
                            <span className="truncate">{child.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </nav>

      {!collapsed && (
        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
          <p>Use the sidebar to explore the active menu hierarchy.</p>
        </div>
      )}
    </aside>
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-y-0 left-0 hidden md:block transition-all duration-300",
          collapsed ? "w-24" : "w-72",
        )}
      >
        <div className="flex h-full flex-col p-4">
          <div className="flex h-full rounded-2xl bg-[#0b1323] shadow-2xl ring-1 ring-white/5">{sidebarContent}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleOpenMobile}
        className="fixed left-4 top-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0b1323] text-white shadow-lg ring-1 ring-white/10 md:hidden"
        aria-label="Open sidebar"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" aria-hidden onClick={handleCloseMobile} />
          <div className="absolute inset-y-0 left-0 w-[18rem] p-4">
            <div className="flex h-full flex-col rounded-2xl bg-[#0b1323] shadow-2xl ring-1 ring-white/5">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
