"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import type { Area, Company, Process } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { listAreas, listProcesses, createProcess, createArea, updateProcess, updateArea } from "@/server/actions/catalogs";

// El padre le pasa `key={companyId}` para que este componente se remonte por
// completo al cambiar de empresa, en vez de sincronizar `items` con un efecto.
function SimpleListEditor<T extends { id: string; name: string }>({
  title,
  items,
  onCreate,
  onRename,
}: {
  title: string;
  items: T[];
  onCreate: (name: string) => Promise<T>;
  onRename: (id: string, name: string) => Promise<T>;
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
      const created = await onCreate(name);
      setList((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    });
  }

  function saveEdit(id: string) {
    const name = editingName.trim();
    if (!name) return;
    startTransition(async () => {
      const updated = await onRename(id, name);
      setList((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setEditingId(null);
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
                <span className="flex-1 text-sm text-slate-900">{item.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(item.id);
                    setEditingName(item.name);
                  }}
                >
                  Editar
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

export function ProcessAreaManager({ companies }: { companies: Company[] }) {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [processes, setProcesses] = useState<Process[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  // Solo montamos los editores una vez que los datos de ESTA empresa llegaron,
  // para no remontarlos (por el `key`) con los datos todavía obsoletos de la
  // empresa anterior mientras el fetch está en curso.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    Promise.all([listProcesses(companyId), listAreas(companyId)]).then(([p, a]) => {
      setProcesses(p);
      setAreas(a);
      setLoadedFor(companyId);
    });
  }, [companyId]);

  if (companies.length === 0) {
    return (
      <Card className="p-6 text-sm text-slate-500">
        Primero registra una empresa en el módulo <span className="font-medium">Empresas</span>.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Label>Empresa</Label>
        <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="max-w-sm">
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Card>

      {loadedFor === companyId ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SimpleListEditor
            key={`processes-${companyId}`}
            title="Procesos"
            items={processes}
            onCreate={(name) => createProcess(companyId, name)}
            onRename={(id, name) => updateProcess(id, name)}
          />
          <SimpleListEditor
            key={`areas-${companyId}`}
            title="Zonas / Lugares"
            items={areas}
            onCreate={(name) => createArea(companyId, name)}
            onRename={(id, name) => updateArea(id, name)}
          />
        </div>
      ) : (
        <p className="text-sm text-slate-400">Cargando...</p>
      )}
    </div>
  );
}
