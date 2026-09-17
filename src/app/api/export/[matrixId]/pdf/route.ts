import { NextResponse } from "next/server";

import { flattenMatrixRows, getMatrixExportData, summarizeMatrixRows } from "@/lib/export/matrix-export";
import { buildMatrixPdfReport } from "@/lib/export/pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ matrixId: string }> }) {
  const { matrixId } = await params;
  const { matrix, tasks } = await getMatrixExportData(matrixId);
  const rows = flattenMatrixRows(tasks);
  const summary = summarizeMatrixRows(tasks, rows);

  const doc = buildMatrixPdfReport({
    companyName: matrix.company?.name ?? "—",
    companyNit: matrix.company?.nit ?? null,
    companySector: matrix.company?.sector ?? null,
    matrixName: matrix.name,
    matrixVersion: matrix.version,
    matrixStatus: matrix.status,
    methodologyName: matrix.methodologyVersion.name,
    createdByName: matrix.createdBy.name,
    summary,
    rows,
  });

  const buffer = Buffer.from(doc.output("arraybuffer"));
  const filename = `Informe-${matrix.name.replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
