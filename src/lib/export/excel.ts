import ExcelJS from "exceljs";

import { PRIORITY_COLOR } from "@/lib/dashboard/colors";
import type { MatrixExportRow } from "./matrix-export";

function toArgb(hex: string) {
  return `FF${hex.replace("#", "").toUpperCase()}`;
}

const COLUMNS: { header: string; key: keyof MatrixExportRow; width: number }[] = [
  { header: "Proceso", key: "proceso", width: 18 },
  { header: "Zona / Lugar", key: "zona", width: 18 },
  { header: "Actividad", key: "actividad", width: 22 },
  { header: "Tarea", key: "tarea", width: 22 },
  { header: "Rutinaria", key: "rutinaria", width: 10 },
  { header: "Peligro", key: "peligro", width: 26 },
  { header: "Clasificación", key: "clasificacion", width: 18 },
  { header: "Fuente", key: "fuente", width: 22 },
  { header: "Medio", key: "medio", width: 22 },
  { header: "Individuo", key: "individuo", width: 22 },
  { header: "ND", key: "nd", width: 6 },
  { header: "NE", key: "ne", width: 6 },
  { header: "NP", key: "np", width: 6 },
  { header: "Interpretación NP", key: "interpretacionNP", width: 16 },
  { header: "NC", key: "nc", width: 6 },
  { header: "NR", key: "nr", width: 8 },
  { header: "Interpretación NR", key: "interpretacionNR", width: 30 },
  { header: "N° Expuestos", key: "expuestos", width: 12 },
  { header: "Peor consecuencia", key: "peorConsecuencia", width: 24 },
  { header: "Requisito legal", key: "requisitoLegal", width: 26 },
  { header: "Eliminación", key: "eliminacion", width: 26 },
  { header: "Sustitución", key: "sustitucion", width: 26 },
  { header: "Ingeniería", key: "ingenieria", width: 26 },
  { header: "Administrativo", key: "administrativo", width: 26 },
  { header: "EPP", key: "epp", width: 26 },
];

export async function buildMatrixExcelWorkbook(
  matrix: { name: string; version: number; company: { name: string; nit: string | null } | null },
  rows: MatrixExportRow[],
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Matriz de Peligros GTC 45";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Matriz IPEVR", {
    views: [{ state: "frozen", ySplit: 2 }],
  });

  sheet.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  sheet.mergeCells(1, 1, 1, COLUMNS.length);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `${matrix.company?.name ?? ""} ${matrix.company?.nit ? `(NIT ${matrix.company.nit})` : ""} — ${matrix.name} v${matrix.version}`;
  titleCell.font = { bold: true, size: 12 };
  titleCell.alignment = { vertical: "middle" };

  const headerRow = sheet.getRow(2);
  COLUMNS.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: toArgb("#2a78d6") } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  headerRow.height = 32;

  for (const row of rows) {
    const excelRow = sheet.addRow(row);
    const priorityColor = row.priority ? PRIORITY_COLOR[row.priority] : null;
    if (priorityColor) {
      const nrCell = excelRow.getCell(COLUMNS.findIndex((c) => c.key === "nr") + 1);
      const interpretationCell = excelRow.getCell(COLUMNS.findIndex((c) => c.key === "interpretacionNR") + 1);
      for (const cell of [nrCell, interpretationCell]) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: toArgb(priorityColor) } };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: cell === nrCell };
      }
    }
  }

  sheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: COLUMNS.length },
  };

  for (const row of sheet.getRows(1, sheet.rowCount) ?? []) {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE1E0D9" } },
        bottom: { style: "thin", color: { argb: "FFE1E0D9" } },
        left: { style: "thin", color: { argb: "FFE1E0D9" } },
        right: { style: "thin", color: { argb: "FFE1E0D9" } },
      };
    });
  }

  return workbook;
}
