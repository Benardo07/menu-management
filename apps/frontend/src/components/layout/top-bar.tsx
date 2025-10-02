"use client";

import { Menu } from "lucide-react";

type TopBarProps = {
  onMenuToggle?: () => void;
};

export function TopBar({ onMenuToggle }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden">
      <button
        type="button"
        onClick={onMenuToggle}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="text-sm font-medium tracking-wide text-slate-600">Menu Management</span>
      <span className="inline-flex h-10 w-10" aria-hidden />
    </header>
  );
}
