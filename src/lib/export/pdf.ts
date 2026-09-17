import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { STATUS } from "@/lib/dashboard/colors";
import type { MatrixExportRow, MatrixReportSummary } from "./matrix-export";

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
}

type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

export function buildMatrixPdfReport(params: {
  companyName: string;
  companyNit: string | null;
  companySector: string | null;
  matrixName: string;
  matrixVersion: number;
  matrixStatus: string;
  methodologyName: string;
  createdByName: string;
  summary: MatrixReportSummary;
  rows: MatrixExportRow[];
}) {
  const {
    companyName,
    companyNit,
    companySector,
    matrixName,
    matrixVersion,
    matrixStatus,
    methodologyName,
    createdByName,
    summary,
    rows,
  } = params;

  const doc = new jsPDF({ unit: "pt", format: "a4" }) as DocWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(11, 11, 11);
  doc.text("Informe ejecutivo — Matriz de Peligros GTC 45", margin, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(82, 81, 78);
  doc.text(
    `Generado el ${new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}`,
    margin,
    y,
  );
  y += 16;

  doc.setDrawColor(225, 224, 217);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(11, 11, 11);
  doc.text(companyName, margin, y);
  y += 14;

  const companyLine = [companyNit ? `NIT ${companyNit}` : null, companySector].filter(Boolean).join("  ·  ");
  if (companyLine) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(82, 81, 78);
    doc.text(companyLine, margin, y);
    y += 16;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(11, 11, 11);
  doc.text(`${matrixName} — versión ${matrixVersion} (${matrixStatus})`, margin, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(82, 81, 78);
  doc.text(`Creada por ${createdByName}  ·  Metodología: ${methodologyName}`, margin, y);
  y += 26;

  // ---- KPIs ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(11, 11, 11);
  doc.text("Resumen ejecutivo", margin, y);
  y += 18;

  const kpis: [string, string | number][] = [
    ["Peligros identificados", summary.totalHazards],
    ["Tareas", summary.totalTasks],
    ["Trabajadores expuestos", summary.totalExposedWorkers],
    ["Peligros con controles", `${summary.pctWithControls}%`],
    ["Peligros con medidas", `${summary.pctWithMeasures}%`],
    ["Medidas pendientes", summary.pendingMeasures],
  ];

  const colWidth = (pageWidth - margin * 2) / 3;
  kpis.forEach(([label, value], index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = margin + col * colWidth;
    const rowY = y + row * 36;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(82, 81, 78);
    doc.text(label, x, rowY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(11, 11, 11);
    doc.text(String(value), x, rowY + 17);
  });
  y += Math.ceil(kpis.length / 3) * 36 + 16;

  // ---- Distribución de riesgos por nivel (barras dibujadas a vector) ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(11, 11, 11);
  doc.text("Distribución de riesgos por nivel", margin, y);
  y += 16;

  const levels: { label: keyof MatrixReportSummary["riskCounts"]; color: string }[] = [
    { label: "Crítica", color: STATUS.critical },
    { label: "Alta", color: STATUS.serious },
    { label: "Media", color: STATUS.warning },
    { label: "Baja", color: STATUS.good },
  ];
  const maxCount = Math.max(1, ...levels.map((l) => summary.riskCounts[l.label]));
  const barMaxWidth = pageWidth - margin * 2 - 110;

  for (const level of levels) {
    const count = summary.riskCounts[level.label];
    const barWidth = count > 0 ? Math.max(4, (count / maxCount) * barMaxWidth) : 0;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(82, 81, 78);
    doc.text(level.label, margin, y + 9);

    if (barWidth > 0) {
      doc.setFillColor(...hexToRgb(level.color));
      doc.roundedRect(margin + 70, y, barWidth, 12, 2, 2, "F");
    }

    doc.setTextColor(11, 11, 11);
    doc.setFont("helvetica", "bold");
    doc.text(String(count), margin + 70 + barWidth + 8, y + 9);
    y += 22;
  }
  y += 10;

  // ---- Principales riesgos ----
  const topRisks = [...rows]
    .filter((r) => r.nr !== null)
    .sort((a, b) => (b.nr ?? 0) - (a.nr ?? 0))
    .slice(0, 10);

  if (topRisks.length > 0) {
    if (y > pageHeight - 160) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(11, 11, 11);
    doc.text("Principales riesgos", margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Tarea", "Peligro", "NR", "Interpretación", "Expuestos"]],
      body: topRisks.map((r) => [
        r.tarea,
        r.peligro,
        String(r.nr),
        r.interpretacionNR,
        r.expuestos != null ? String(r.expuestos) : "—",
      ]),
      styles: { fontSize: 8, cellPadding: 5 },
      headStyles: { fillColor: hexToRgb("#2a78d6"), textColor: 255 },
      margin: { left: margin, right: margin },
    });

    y = (doc.lastAutoTable?.finalY ?? y) + 24;
  }

  // ---- Medidas de intervención pendientes ----
  const pendingRows = rows.filter(
    (r) => r.nr !== null && !(r.eliminacion || r.sustitucion || r.ingenieria || r.administrativo || r.epp),
  );

  if (pendingRows.length > 0) {
    if (y > pageHeight - 140) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(11, 11, 11);
    doc.text(`Medidas de intervención pendientes (${pendingRows.length})`, margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Tarea", "Peligro", "Nivel de riesgo"]],
      body: pendingRows.slice(0, 25).map((r) => [r.tarea, r.peligro, r.interpretacionNR]),
      styles: { fontSize: 8, cellPadding: 5 },
      headStyles: { fillColor: hexToRgb("#eb6834"), textColor: 255 },
      margin: { left: margin, right: margin },
    });
  }

  return doc;
}
