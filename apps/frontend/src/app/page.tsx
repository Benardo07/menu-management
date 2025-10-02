"use client";

import { useEffect, useState } from "react";
import { ComingSoon } from "@/components/coming-soon";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchMenus } from "@/lib/redux/slices/menu-slice";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";

export default function Home() {
  const dispatch = useAppDispatch();
  const menusLoaded = useAppSelector((state) => state.menus.list.length > 0);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { collapsed } = useSidebar();

  useEffect(() => {
    if (!menusLoaded) {
      dispatch(fetchMenus());
    }
  }, [dispatch, menusLoaded]);

  return (
    <div className="min-h-dvh bg-white">
      <AppSidebar mobileOpen={isMobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />
      <TopBar onMenuToggle={() => setMobileSidebarOpen(true)} />

      <main className={cn("transition-all duration-300", collapsed ? "md:pl-28" : "md:pl-[21rem]")}>
        <div className="mx-auto w-full max-w-[1200px] px-4 py-12 md:px-8">
          <ComingSoon description="Select a section from the sidebar. Additional pages will arrive soon." />
        </div>
      </main>
    </div>
  );
}
