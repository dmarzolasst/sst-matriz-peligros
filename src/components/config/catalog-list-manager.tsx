"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { clsx } from "clsx";
import type { CatalogCategory, CatalogItem } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createCatalogItem, updateCatalogItem } from "@/server/actions/catalogs";

export function CatalogListManager({
  category,
  title,
  items,
  parentId,
}: {
  category: CatalogCategory;
  title: string;
  items: CatalogItem[];
  parentId?: string;
}) {
  const [list, setList] = useState(items);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const created = await createCatalogItem({ category, name, parentId });
      setList((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    });
  }

  function startEdit(item: CatalogItem) {
    setEditingId(item.id);
    setEditingName(item.name);
  }

  function saveEdit(id: string) {
    const name = editingName.trim();
    if (!name) return;
    startTransition(async () => {
      const updated = await updateCatalogItem(id, { name });
      setList((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setEditingId(null);
    });
  }

  function toggleActive(item: CatalogItem) {
    startTransition(async () => {
      const updated = await updateCatalogItem(item.id, { active: !item.active });
      setList((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    });
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-1.5">
        {list.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2">
            {editingId === item.id ? (
              <>
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="h-8 flex-1 py-1 text-sm"
                  autoFocus
                />
                <Button type="button" variant="ghost" onClick={() => saveEdit(item.id)} disabled={pending}>
                  Guardar
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <span className={clsx("flex-1 text-sm", !item.active && "text-slate-400 line-through")}>
                  {item.name}
                </span>
                {!item.active && <Badge tone="slate">Inactivo</Badge>}
                <Button type="button" variant="ghost" onClick={() => startEdit(item)}>
                  Editar
                </Button>
                <Button type="button" variant="ghost" onClick={() => toggleActive(item)} disabled={pending}>
                  {item.active ? "Desactivar" : "Activar"}
                </Button>
              </>
            )}
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-slate-400">Sin elementos todavía.</p>}
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nuevo elemento..."
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <Button type="button" onClick={handleCreate} disabled={pending}>
          <Plus size={16} />
          Agregar
        </Button>
      </div>
    </Card>
  );
}
