"use client";

import { signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";

export function Topbar({
  userName,
  userEmail,
  onMenuClick,
}: {
  userName?: string | null;
  userEmail?: string | null;
  onMenuClick: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-4">
        <div className="min-w-0 text-right">
          <p className="truncate text-sm font-medium text-slate-900">{userName ?? userEmail}</p>
          {userName && <p className="hidden truncate text-xs text-slate-500 sm:block">{userEmail}</p>}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 transition hover:bg-slate-50 sm:px-3"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
