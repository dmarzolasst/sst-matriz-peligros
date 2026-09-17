import { NextResponse } from "next/server";

import { flattenMatrixRows, getMatrixExportData } from "@/lib/export/matrix-export";
import { buildMatrixExcelWorkbook } from "@/lib/export/excel";

export async function GET(_request: Request, { params }: { params: Promise<{ matrixId: string }> }) {
  const { matrixId } = await params;
  const { matrix, tasks } = await getMatrixExportData(matrixId);
  const rows = flattenMatrixRows(tasks);
  const workbook = await buildMatrixExcelWorkbook(matrix, rows);
  const buffer = await workbook.xlsx.writeBuffer();

  const filename = `Matriz-${matrix.name.replace(/[^a-zA-Z0-9]+/g, "-")}.xlsx`;

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
