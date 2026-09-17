"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Factory,
  AlertTriangle,
  ShieldCheck,
  Wrench,
  FileBarChart,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  ready: boolean;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, ready: true },
  { href: "/empresas", label: "Empresas", icon: Building2, ready: true },
  { href: "/matrices", label: "Matrices", icon: ClipboardList, ready: true },
  { href: "/procesos", label: "Procesos", icon: Factory, ready: true },
  { href: "/peligros", label: "Peligros", icon: AlertTriangle, ready: true },
  { href: "/controles", label: "Controles", icon: ShieldCheck, ready: true },
  { href: "/medidas", label: "Medidas de intervención", icon: Wrench, ready: true },
  { href: "/reportes", label: "Reportes", icon: FileBarChart, ready: false },
  { href: "/configuracion", label: "Configuración", icon: Settings, ready: true },
];

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3">
      {NAV.map(({ href, label, icon: Icon, ready }) => {
        if (!ready) {
          return (
            <div
              key={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300"
              title="Próximamente"
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide">Próx.</span>
            </div>
          );
        }

        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const header = (
    <div className="flex items-center justify-between px-5 py-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">SST · GTC 45</p>
        <h1 className="mt-1 text-base font-bold text-slate-900">Matriz de Peligros</h1>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
        aria-label="Cerrar menú"
      >
        <X size={18} />
      </button>
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-200 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {header}
        {nav}
      </aside>

      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        {header}
        {nav}
      </aside>
    </>
  );
}
