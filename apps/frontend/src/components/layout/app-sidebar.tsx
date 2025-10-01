"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectItem, selectMenu } from "@/lib/redux/slices/menu-slice";

interface SidebarGroup {
  id: string;
  title: string;
  children: Array<{ id: string; title: string }>;
}

const LOGO_SRC = "/logo.png";
const MENU_TOGGLE_SRC = "/menu_open.png";
const FOLDER_SRC = "/folder.svg";
const SUBMENU_SRC = "/submenu.svg";

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  const menus = useAppSelector((state) => state.menus);
  const dispatch = useAppDispatch();

  const selectedMenu = menus.selectedMenuId ? menus.entities[menus.selectedMenuId] : null;
  const selectedItemId = menus.selectedItemId ?? null;

  const groups = useMemo<SidebarGroup[]>(() => {
    if (!selectedMenu?.rootItem) {
      return [];
    }

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
        });
      });
    });

    return result;
  }, [selectedMenu]);

  const activeGroupId = useMemo(() => {
    if (!selectedItemId) return null;
    for (const group of groups) {
      if (group.id === selectedItemId) {
        return group.id;
      }
      if (group.children.some((child) => child.id === selectedItemId)) {
        return group.id;
      }
    }
    return null;
  }, [groups, selectedItemId]);

  const handleGroupClick = (group: SidebarGroup) => {
    if (!selectedMenu) return;
    if (menus.selectedMenuId !== selectedMenu.id) {
      dispatch(selectMenu(selectedMenu.id));
    }
    dispatch(selectItem(group.id));
    setOpen(false);
  };

  const handleChildClick = (group: SidebarGroup, childId: string) => {
    if (!selectedMenu) return;
    if (menus.selectedMenuId !== selectedMenu.id) {
      dispatch(selectMenu(selectedMenu.id));
    }
    dispatch(selectItem(childId));
    setOpen(false);
  };

  const SidebarBody = (
    <aside
      aria-label="Main navigation"
      className="flex h-full w-72 flex-col gap-6 bg-[#0b1323] p-4 text-slate-100 md:gap-8 md:p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src={LOGO_SRC} alt="CLOIT" width={64} height={32} className="h-8 w-24 rounded-lg" />
        </div>
        <button
          className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:bg-white/5"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
        >
          <Image src={MENU_TOGGLE_SRC} alt="Close menu" width={20} height={20} className="rotate-180" />
        </button>
      </div>

      <nav className="space-y-4">
        {groups.length === 0 ? (
          <p className="px-2 text-sm text-slate-400">Select a menu to view its sections.</p>
        ) : (
          groups.map((group) => {
            const isActiveGroup = activeGroupId === group.id;
            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() => handleGroupClick(group)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition",
                    isActiveGroup ? "bg-lime-400 text-slate-900" : "text-slate-200 hover:bg-white/10",
                  )}
                >
                  <Image src={FOLDER_SRC} alt="Folder" width={16} height={16} />
                  <span>{group.title}</span>
                </button>

                {group.children.length > 0 && (
                  <ul className="mt-2 space-y-1 pl-10 text-sm text-slate-300">
                    {group.children.map((child) => {
                      const isActiveChild = selectedItemId === child.id;
                      return (
                        <li key={child.id}>
                          <button
                            type="button"
                            onClick={() => handleChildClick(group, child.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2 transition",
                              isActiveChild ? "bg-white/15 text-white" : "hover:bg-white/5",
                            )}
                          >
                            <Image src={SUBMENU_SRC} alt="Sub menu" width={14} height={14} />
                            <span>{child.title}</span>
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

      <div className="mt-auto rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 p-4 text-xs text-slate-400 ring-1 ring-white/5">
        <p>Use the sidebar to jump between sections of the active menu.</p>
      </div>
    </aside>
  );

  return (
    <>
      <div className="fixed inset-y-0 left-0 hidden w-72 md:block">{SidebarBody}</div>

      <button
        className="fixed left-3 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-700 shadow-md ring-1 ring-black/5 md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open sidebar"
      >
        <Image src={MENU_TOGGLE_SRC} alt="Open menu" width={20} height={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">{SidebarBody}</div>
        </div>
      )}
    </>
  );
}

