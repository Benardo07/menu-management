"use client";

import { useMemo, useState } from "react";
import {
  Menu,
  Folder,
  Layers,
  ListTree,
  Users2,
  Shield,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectItem, selectMenu } from "@/lib/redux/slices/menu-slice";

const menuIcons = [Layers, Users2, Shield];

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  const menus = useAppSelector((state) => state.menus);
  const dispatch = useAppDispatch();

  const groupedMenus = useMemo(
    () =>
      menus.list.map((menu, index) => ({
        id: menu.id,
        name: menu.name,
        items: menu.rootItem?.children ?? [],
        icon: menuIcons[index % menuIcons.length] ?? Layers,
      })),
    [menus.list],
  );

  const handleItemClick = (menuId: string, itemId: string | null) => {
    dispatch(selectMenu(menuId));
    if (itemId) {
      dispatch(selectItem(itemId));
    }
    setOpen(false);
  };

  const SidebarBody = (
    <aside
      aria-label="Main"
      className="flex h-full w-72 flex-col gap-6 bg-[#0b1323] p-4 text-slate-200 md:gap-8 md:p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-800 text-white shadow-inner">
            <ListTree className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-wide">CLOIT</span>
        </div>
        <button
          className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:bg-white/5"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
        >
          <ChevronRight className="h-5 w-5 rotate-180" />
        </button>
      </div>

      <nav className="space-y-6">
        {groupedMenus.length === 0 ? (
          <p className="px-2 text-sm text-slate-400">No menus available yet.</p>
        ) : (
          groupedMenus.map((group) => {
            const Icon = group.icon ?? Layers;
            return (
              <div key={group.id}>
                <p className="mb-2 flex items-center gap-2 px-2 text-xs uppercase tracking-wider text-slate-400">
                  <Icon className="h-4 w-4 text-slate-500" />
                  {group.name}
                </p>
                <ul className="space-y-1">
                  {group.items.length === 0 ? (
                    <li className="flex items-center gap-2 rounded-lg px-2 py-2 text-slate-400">
                      <Folder className="h-4 w-4" /> <span>Empty</span>
                    </li>
                  ) : (
                    group.items.map((item) => {
                      const isActive = menus.selectedMenuId === group.id && menus.selectedItemId === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => handleItemClick(group.id, item.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition",
                              isActive
                                ? "bg-lime-400 text-slate-900"
                                : "text-slate-300 hover:bg-white/5 hover:text-white",
                            )}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <span
                              className={cn(
                                "inline-block h-2 w-2 rounded-full",
                                isActive ? "bg-slate-900/70" : "bg-slate-600",
                              )}
                              aria-hidden
                            />
                            {item.title}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            );
          })
        )}
      </nav>

      <div className="mt-auto rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 p-4 text-xs text-slate-400 ring-1 ring-white/5">
        <p>Sidebar renders the current menu tree so you can jump between top-level sections.</p>
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
        <Menu className="h-5 w-5" />
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
