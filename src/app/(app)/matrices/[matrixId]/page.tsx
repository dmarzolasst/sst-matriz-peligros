import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, FileText } from "lucide-react";

import { getMatrixById } from "@/server/actions/matrices";
import { listTasksForMatrix } from "@/server/actions/tasks";
import { MatrixStatusBadge } from "@/components/matrices/matrix-status-badge";
import { TaskListPanel } from "@/components/matrices/task-list-panel";
import { Button } from "@/components/ui/button";

export default async function MatrixDetailPage({ params }: { params: Promise<{ matrixId: string }> }) {
  const { matrixId } = await params;
  const [matrix, tasks] = await Promise.all([getMatrixById(matrixId), listTasksForMatrix(matrixId)]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/matrices" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft size={14} />
            Volver a matrices
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{matrix.name}</h1>
            <MatrixStatusBadge status={matrix.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {matrix.company?.name} · Versión {matrix.version} · Creada por {matrix.createdBy.name} · Metodología:{" "}
            {matrix.methodologyVersion.name}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/export/${matrixId}/excel`}>
            <Button type="button" variant="secondary">
              <FileSpreadsheet size={16} />
              Exportar Excel
            </Button>
          </a>
          <a href={`/api/export/${matrixId}/pdf`}>
            <Button type="button" variant="secondary">
              <FileText size={16} />
              Exportar PDF
            </Button>
          </a>
        </div>
      </div>

      <TaskListPanel matrixId={matrixId} tasks={tasks} />
    </div>
  );
}
