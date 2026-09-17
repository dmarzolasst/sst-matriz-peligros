"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Plus, ChevronDown } from "lucide-react";

export type ComboOption = { id: string; label: string };

export function CreatableSelect({
  value,
  options,
  placeholder = "Selecciona o crea...",
  onChange,
  onCreate,
  disabled,
}: {
  value: string | null;
  options: ComboOption[];
  placeholder?: string;
  onChange: (id: string) => void;
  onCreate?: (name: string) => Promise<ComboOption>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.id === value) ?? null;

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = options.some((option) => option.label.toLowerCase() === query.trim().toLowerCase());

  async function handleCreate() {
    if (!onCreate || !query.trim()) return;
    setCreating(true);
    try {
      const created = await onCreate(query.trim());
      onChange(created.id);
      setOpen(false);
      setQuery("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
          disabled && "cursor-not-allowed bg-slate-50 text-slate-400",
        )}
      >
        <span className={clsx("truncate", selected ? "text-slate-900" : "text-slate-400")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </button>

      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Escribe para buscar..."
            className="w-full border-b border-slate-100 px-3 py-2 text-sm outline-none"
          />
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={clsx(
                  "block w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
                  option.id === value && "bg-blue-50 text-blue-700",
                )}
              >
                {option.label}
              </button>
            ))}
            {filtered.length === 0 && !query && (
              <p className="px-3 py-2 text-sm text-slate-400">Sin opciones todavía.</p>
            )}
            {onCreate && query.trim() && !exactMatch && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              >
                <Plus size={14} />
                {creating ? "Creando..." : `Crear "${query.trim()}"`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
