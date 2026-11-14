"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { IsakResult } from "@/lib/isak/calculations";
import { loadLogoDataUrl, LOGO_DARK_SRC } from "@/lib/pdf-branding";
import { PROFESSIONAL_BYLINE, PROFESSIONAL_LICENSE, PROFESSIONAL_NAME, PROFESSIONAL_TITLE } from "@/lib/branding";

interface PdfPayload {
  paciente: string;
  fecha: string;
  evaluador: string;
  currentDate?: string;
  compareWithDate?: string;
  evolutionData?: { date: string; result: IsakResult }[];
}

type RGB = [number, number, number];
type PdfDocument = jsPDF & { lastAutoTable?: { finalY: number } };

const GREEN: RGB = [19, 128, 91];
const DARK: RGB = [28, 43, 37];
const MUTED: RGB = [93, 108, 101];
const LIGHT: RGB = [242, 247, 244];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtNum(v: number | null | undefined, dec = 1): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(dec).replace(".", ",");
}

export function IsakPdfButton({
  result,
  paciente,
  fecha,
  evaluador,
  currentDate,
  compareWithDate,
  evolutionData = [],
}: PdfPayload & { result: IsakResult }) {
  const generatePdf = async () => {
    try {
      const sorted = [...(evolutionData ?? [])]
        .filter((item): item is { date: string; result: IsakResult } => Boolean(item?.date && item?.result))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const currentIdx = currentDate
        ? Math.max(0, sorted.findIndex((d) => d.date === currentDate))
        : sorted.length - 1;
      const other = sorted.filter((d) => d.date !== (sorted[currentIdx]?.date ?? ""));
      const previous =
        (compareWithDate ? other.find((d) => d.date === compareWithDate) : undefined) ??
        sorted[currentIdx - 1] ??
        other[other.length - 1] ??
        null;

      const prevDateLabel = previous ? fmtDate(previous.date) : null;

      let logoDataUrl: string | null = null;
      try {
        logoDataUrl = await loadLogoDataUrl(LOGO_DARK_SRC);
      } catch {
        logoDataUrl = null;
      }

      const doc = new jsPDF({ unit: "mm", format: "a4" }) as PdfDocument;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;

      // ────────────────────────────────────────────────────────────
      // PÁGINA 1: INFORME VISUAL COMPARATIVO (referencia ISAK metry)
      // ────────────────────────────────────────────────────────────
      drawPageChrome(doc, paciente, fecha, logoDataUrl);
      doc.setFillColor(...GREEN);
      doc.rect(0, 0, pageWidth, 4, "F");

      doc.setTextColor(...GREEN);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`${PROFESSIONAL_NAME.toUpperCase()} · ${PROFESSIONAL_TITLE.toUpperCase()} · ${PROFESSIONAL_LICENSE}`, margin, 13);

      doc.setTextColor(...DARK);
      doc.setFontSize(17);
      doc.text("Informe antropométrico ISAK", margin, 21);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(
        `Paciente: ${paciente}   |   Fecha: ${fecha}${prevDateLabel ? `   |   Comparado con: ${prevDateLabel}` : ""}   |   Evaluador: ${evaluador}`,
        margin,
        27
      );

      // 2 Gráficos superiores lado a lado (en kg)
      const chartW = (contentWidth - 6) / 2;
      const chartY = 32;
      const chartH = 44;

      const curFatKg = result.bicompartimental.masaGrasaKg ?? result.fraccionamiento.masaAdiposaKg ?? 0;
      const curLeanKg =
        result.bicompartimental.masaLibreGrasaKg ??
        Math.max(0, result.datos.peso - (result.fraccionamiento.masaAdiposaKg ?? 0));
      const prevFatKg = previous
        ? previous.result.bicompartimental.masaGrasaKg ?? previous.result.fraccionamiento.masaAdiposaKg ?? 0
        : null;
      const prevLeanKg = previous
        ? previous.result.bicompartimental.masaLibreGrasaKg ??
          Math.max(0, previous.result.datos.peso - (previous.result.fraccionamiento.masaAdiposaKg ?? 0))
        : null;

      drawComparisonKgChart(doc, {
        x: margin,
        y: chartY,
        w: chartW,
        h: chartH,
        seriesALabel: "Masa grasa",
        seriesBLabel: "Masa libre de grasa",
        colorA: [254, 249, 195],
        colorB: [185, 130, 130],
        curA: curFatKg,
        curB: curLeanKg,
        curWeight: result.datos.peso,
        prevLabel: prevDateLabel,
        prevA: prevFatKg,
        prevB: prevLeanKg,
        prevWeight: previous?.result.datos.peso ?? null,
      });

      drawComparisonKgChart(doc, {
        x: margin + chartW + 6,
        y: chartY,
        w: chartW,
        h: chartH,
        seriesALabel: "Tejido adiposo",
        seriesBLabel: "Tejido muscular",
        colorA: [250, 204, 21],
        colorB: [185, 28, 28],
        curA: result.fraccionamiento.masaAdiposaKg ?? 0,
        curB: result.fraccionamiento.masaMuscularKg ?? 0,
        curWeight: result.datos.peso,
        prevLabel: prevDateLabel,
        prevA: previous?.result.fraccionamiento.masaAdiposaKg ?? null,
        prevB: previous?.result.fraccionamiento.masaMuscularKg ?? null,
        prevWeight: previous?.result.datos.peso ?? null,
      });

      // Franja: Distribución adiposo muscular
      let y = chartY + chartH + 8;
      drawSectionBanner(doc, "Distribución adiposo muscular", margin, y, contentWidth);
      y += 10;

      const perVal = (res: IsakResult, name: string) =>
        res.mediciones.perimetros.find((p) => p.nombre === name)?.valor ?? 0;

      const distRows = [
        {
          label: "Brazo relajado (cm)",
          cur: perVal(result, "Brazo relajado"),
          prev: previous ? perVal(previous.result, "Brazo relajado") : null,
        },
        {
          label: "Brazo corregido (cm)",
          cur: result.distribucion.brazoCorregido ?? 0,
          prev: previous ? previous.result.distribucion.brazoCorregido : null,
        },
        {
          label: "Muslo medio (cm)",
          cur: perVal(result, "Muslo medio"),
          prev: previous ? perVal(previous.result, "Muslo medio") : null,
        },
        {
          label: "Muslo corregido (cm)",
          cur: result.distribucion.musloCorregido ?? 0,
          prev: previous ? previous.result.distribucion.musloCorregido : null,
        },
        {
          label: "Pierna (cm)",
          cur: perVal(result, "Pierna"),
          prev: previous ? perVal(previous.result, "Pierna") : null,
        },
        {
          label: "Pierna corregida (cm)",
          cur: result.distribucion.piernaCorregida ?? 0,
          prev: previous ? previous.result.distribucion.piernaCorregida : null,
        },
      ];

      const leftDistW = contentWidth * 0.54;
      drawHorizontalCompareBars(doc, distRows, margin, y, leftDistW, 64, prevDateLabel);

      // Derecha: Silueta anatómica bicolor + porcentajes por zona
      drawAnatomicalDistributionBlock(
        doc,
        result,
        margin + leftDistW + 4,
        y,
        contentWidth - leftDistW - 4,
        64
      );

      // Franja: Índices de composición corporal
      y += 72;
      drawSectionBanner(doc, "Índices de composición corporal", margin, y, contentWidth);
      y += 12;

      drawCompositionIndicesBlock(doc, result, previous?.result ?? null, prevDateLabel, margin, y, contentWidth);

      // ────────────────────────────────────────────────────────────
      // PÁGINA 2: PLIEGUES Y PERÍMETROS COMPARADOS + MEDICIONES
      // ────────────────────────────────────────────────────────────
      doc.addPage();
      drawPageChrome(doc, paciente, fecha, logoDataUrl);
      doc.setFillColor(...GREEN);
      doc.rect(0, 0, pageWidth, 4, "F");

      let p2Y = 16;
      drawSectionBanner(doc, "Comparativa de pliegues cutáneos (mm) y perímetros (cm)", margin, p2Y, contentWidth);
      p2Y += 12;

      const sfBars = result.adiposidad.porPliegue.map((site) => ({
        label: site.nombre.slice(0, 8),
        cur: site.valor,
        prev: previous?.result.adiposidad.porPliegue.find((p) => p.nombre === site.nombre)?.valor ?? null,
      }));
      const perBars = result.mediciones.perimetros.map((site) => ({
        label: site.nombre.replace("Brazo flexionado y contraído", "Brazo flex.").slice(0, 11),
        cur: site.valor ?? 0,
        prev: previous?.result.mediciones.perimetros.find((p) => p.nombre === site.nombre)?.valor ?? null,
      }));

      const halfW = (contentWidth - 6) / 2;
      drawVerticalGroupBars(doc, "Pliegues cutáneos (mm)", sfBars, margin, p2Y, halfW, 48, prevDateLabel);
      drawVerticalGroupBars(doc, "Perímetros (cm)", perBars, margin + halfW + 6, p2Y, halfW, 48, prevDateLabel);

      p2Y += 56;
      drawSectionBanner(doc, "Detalle de mediciones y composición tisular", margin, p2Y, contentWidth);
      p2Y += 10;

      const detailRows = [
        ...result.adiposidad.porPliegue.map((s) => {
          const prevV = previous?.result.adiposidad.porPliegue.find((p) => p.nombre === s.nombre)?.valor;
          const diff = prevV != null ? `${s.valor - prevV > 0 ? "+" : ""}${(s.valor - prevV).toFixed(1)} mm` : "—";
          return ["Pliegue", s.nombre, `${s.valor} mm`, prevV != null ? `${prevV} mm` : "—", diff];
        }),
        [
          "Pliegues",
          "Sumatorio 6 pliegues",
          result.sumatorio6Pliegues != null ? `${result.sumatorio6Pliegues} mm` : "—",
          previous?.result.sumatorio6Pliegues != null ? `${previous.result.sumatorio6Pliegues} mm` : "—",
          result.sumatorio6Pliegues != null && previous?.result.sumatorio6Pliegues != null
            ? `${result.sumatorio6Pliegues - previous.result.sumatorio6Pliegues > 0 ? "+" : ""}${(result.sumatorio6Pliegues - previous.result.sumatorio6Pliegues).toFixed(1)} mm`
            : "—",
        ],
        ...result.mediciones.perimetros.map((s) => {
          const prevV = previous?.result.mediciones.perimetros.find((p) => p.nombre === s.nombre)?.valor;
          const diff =
            s.valor != null && prevV != null
              ? `${s.valor - prevV > 0 ? "+" : ""}${(s.valor - prevV).toFixed(1)} cm`
              : "—";
          return ["Perímetro", s.nombre, s.valor != null ? `${s.valor} cm` : "—", prevV != null ? `${prevV} cm` : "—", diff];
        }),
      ];

      autoTable(doc, {
        startY: p2Y,
        head: [["Tipo", "Sitio", "Actual", prevDateLabel ?? "Anterior", "Diferencia"]],
        body: detailRows,
        theme: "striped",
        margin: { left: margin, right: margin },
        styles: {
          font: "helvetica",
          fontSize: 7.5,
          textColor: DARK,
          cellPadding: 2,
          lineColor: [224, 232, 226],
          lineWidth: 0.15,
        },
        headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [247, 250, 248] },
      });

      const afterTableY = (doc.lastAutoTable?.finalY ?? p2Y + 80) + 8;
      autoTable(doc, {
        startY: afterTableY,
        head: [["Componente / Indicador", "Resultado actual", "Detalle / Referencia"]],
        body: [
          ["Peso / Talla / IMC", `${result.datos.peso} kg · ${result.datos.talla} cm · IMC ${result.datos.imc}`, result.datos.imcClasificacion],
          ["Masa adiposa (Kerr)", `${result.fraccionamiento.masaAdiposaKg ?? "—"} kg (${result.fraccionamiento.masaAdiposaPct ?? "—"}%)`, `Zona predominante: ${result.zonas.adiposo.predominante ?? "—"}`],
          ["Masa muscular (Lee)", `${result.fraccionamiento.masaMuscularKg ?? "—"} kg (${result.fraccionamiento.masaMuscularPct ?? "—"}%)`, `Zona predominante: ${result.zonas.muscular.predominante ?? "—"}`],
          ["Masa ósea (Rocha)", `${result.fraccionamiento.masaOseaKg ?? "—"} kg (${result.fraccionamiento.masaOseaPct ?? "—"}%)`, "Basada en diámetros óseos"],
          ["Gasto energético", `MB: ${result.gastoEnergetico.metabolismoBasal ?? "—"} kcal · GET: ${result.gastoEnergetico.gastoTotal ?? "—"} kcal`, result.gastoEnergetico.nivelActividad],
        ],
        theme: "plain",
        margin: { left: margin, right: margin },
        styles: { font: "helvetica", fontSize: 7.5, textColor: DARK, cellPadding: 2 },
        headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: LIGHT },
      });

      doc.save(`Informe-antropometrico-${paciente.replace(/\s+/g, "-")}-${fecha.replaceAll("/", "-")}.pdf`);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo generar el informe antropométrico");
    }
  };

  return (
    <Button onClick={generatePdf} variant="outline" size="sm">
      <Download className="mr-2 h-4 w-4" />
      Exportar informe antropométrico
    </Button>
  );
}

function drawPageChrome(doc: jsPDF, paciente: string, fecha: string, logoDataUrl?: string | null) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const page = doc.getNumberOfPages();
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", pageWidth - 14 - 28, 7, 28, 14.8);
    } catch {
      void 0;
    }
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.setDrawColor(220, 229, 223);
  doc.line(14, pageHeight - 13, pageWidth - 14, pageHeight - 13);
  doc.text(PROFESSIONAL_BYLINE, 14, pageHeight - 8);
  doc.text(`${paciente} · ${fecha} · Página ${page}`, pageWidth - 14, pageHeight - 8, { align: "right" });
}

function drawSectionBanner(doc: jsPDF, title: string, x: number, y: number, w: number) {
  doc.setFillColor(...GREEN);
  doc.rect(x, y, w, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title, x + 3, y + 4.9);
}

function drawComparisonKgChart(
  doc: jsPDF,
  cfg: {
    x: number;
    y: number;
    w: number;
    h: number;
    seriesALabel: string;
    seriesBLabel: string;
    colorA: RGB;
    colorB: RGB;
    curA: number;
    curB: number;
    curWeight: number;
    prevLabel: string | null;
    prevA: number | null;
    prevB: number | null;
    prevWeight: number | null;
  }
) {
  const { x, y, w, h } = cfg;
  doc.setDrawColor(160, 170, 165);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);

  // Leyenda superior
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setFillColor(...cfg.colorA);
  doc.rect(x + 3, y + 2.5, 3, 2.5, "FD");
  doc.setTextColor(...DARK);
  doc.text(cfg.seriesALabel, x + 7.5, y + 4.6);

  doc.setFillColor(...cfg.colorB);
  doc.rect(x + 28, y + 2.5, 3, 2.5, "FD");
  doc.text(cfg.seriesBLabel, x + 32.5, y + 4.6);

  doc.setFillColor(20, 184, 166);
  doc.circle(x + w - 24, y + 3.8, 0.9, "F");
  doc.text("Masa corporal", x + w - 22, y + 4.6);

  const plotX = x + 9;
  const plotY = y + 8;
  const plotW = w - 12;
  const plotH = h - 14;
  const baseLineY = plotY + plotH;

  const maxVal = Math.max(
    cfg.curWeight,
    cfg.prevWeight ?? 0,
    cfg.curA,
    cfg.curB,
    cfg.prevA ?? 0,
    cfg.prevB ?? 0,
    20
  ) * 1.15;

  // Ejes
  doc.setDrawColor(180, 190, 185);
  doc.line(plotX, plotY, plotX, baseLineY);
  doc.line(plotX, baseLineY, plotX + plotW, baseLineY);

  doc.setFontSize(6);
  doc.setTextColor(...MUTED);
  doc.text("kg", x + 2, plotY + plotH / 2);
  [0, Math.round(maxVal / 2), Math.round(maxVal)].forEach((tick) => {
    const ty = baseLineY - (tick / maxVal) * plotH;
    doc.text(String(tick), plotX - 1.5, ty + 1, { align: "right" });
  });

  const groups = [
    { label: "Actual", a: cfg.curA, b: cfg.curB, wVal: cfg.curWeight },
    ...(cfg.prevLabel && cfg.prevA != null && cfg.prevB != null && cfg.prevWeight != null
      ? [{ label: cfg.prevLabel, a: cfg.prevA, b: cfg.prevB, wVal: cfg.prevWeight }]
      : []),
  ];

  const groupW = plotW / Math.max(1, groups.length);
  const barW = Math.min(11, groupW * 0.34);
  const weightPoints: { px: number; py: number }[] = [];

  groups.forEach((g, idx) => {
    const cx = plotX + idx * groupW + groupW / 2;
    const hA = (g.a / maxVal) * plotH;
    const hB = (g.b / maxVal) * plotH;

    doc.setDrawColor(80, 80, 80);
    doc.setFillColor(...cfg.colorA);
    doc.rect(cx - barW - 0.8, baseLineY - hA, barW, hA, "FD");
    doc.setFontSize(6.2);
    doc.setTextColor(...DARK);
    doc.text(fmtNum(g.a), cx - barW / 2 - 0.8, baseLineY - hA - 1, { align: "center" });

    doc.setFillColor(...cfg.colorB);
    doc.rect(cx + 0.8, baseLineY - hB, barW, hB, "FD");
    doc.text(fmtNum(g.b), cx + barW / 2 + 0.8, baseLineY - hB - 1, { align: "center" });

    doc.setFontSize(7);
    doc.text(g.label, cx, baseLineY + 4, { align: "center" });

    const wy = baseLineY - (g.wVal / maxVal) * plotH;
    weightPoints.push({ px: cx, py: wy });
  });

  if (weightPoints.length > 0) {
    doc.setDrawColor(20, 184, 166);
    doc.setFillColor(20, 184, 166);
    doc.setLineWidth(0.5);
    weightPoints.forEach((pt, idx) => {
      doc.circle(pt.px, pt.py, 1, "F");
      if (idx + 1 < weightPoints.length) {
        const next = weightPoints[idx + 1];
        doc.line(pt.px, pt.py, next.px, next.py);
      }
    });
  }
}

function drawHorizontalCompareBars(
  doc: jsPDF,
  rows: { label: string; cur: number; prev: number | null }[],
  x: number,
  y: number,
  w: number,
  h: number,
  prevLabel: string | null
) {
  const labelW = 32;
  const barAreaX = x + labelW;
  const barAreaW = w - labelW - 4;
  const maxVal = Math.max(...rows.flatMap((r) => [r.cur, r.prev ?? 0]), 40) * 1.1;
  const rowH = (h - 8) / rows.length;

  rows.forEach((r, idx) => {
    const ry = y + idx * rowH;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...DARK);
    doc.text(r.label, barAreaX - 2, ry + rowH * 0.58, { align: "right" });

    const curW = (r.cur / maxVal) * barAreaW;
    if (r.prev != null) {
      const prevW = (r.prev / maxVal) * barAreaW;
      doc.setFillColor(244, 132, 95);
      doc.rect(barAreaX, ry + 0.8, prevW, rowH * 0.36, "F");
      doc.setFillColor(102, 194, 165);
      doc.rect(barAreaX, ry + rowH * 0.44, curW, rowH * 0.42, "F");
      doc.setFontSize(6);
      doc.setTextColor(...DARK);
      if (curW > 8) doc.text(fmtNum(r.cur, 1), barAreaX + curW / 2, ry + rowH * 0.74, { align: "center" });
    } else {
      doc.setFillColor(102, 194, 165);
      doc.rect(barAreaX, ry + 1.4, curW, rowH * 0.56, "F");
      doc.setFontSize(6.2);
      if (curW > 8) doc.text(fmtNum(r.cur, 1), barAreaX + curW / 2, ry + rowH * 0.56, { align: "center" });
    }
  });

  // Leyenda inferior
  const ly = y + h - 2;
  doc.setFillColor(102, 194, 165);
  doc.rect(barAreaX + 8, ly - 2.3, 4, 2.2, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(...DARK);
  doc.text("Actual", barAreaX + 13.5, ly - 0.4);

  if (prevLabel) {
    doc.setFillColor(244, 132, 95);
    doc.rect(barAreaX + 34, ly - 2.3, 4, 2.2, "F");
    doc.text(prevLabel, barAreaX + 39.5, ly - 0.4);
  }
}

function drawAnatomicalDistributionBlock(
  doc: jsPDF,
  result: IsakResult,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const centerX = x + w / 2;
  const leftColX = x + w * 0.16;
  const rightColX = x + w * 0.84;

  // Títulos
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9);
  doc.text("Tejido adiposo", leftColX, y + 4, { align: "center" });
  doc.setTextColor(185, 28, 28);
  doc.text("Tejido muscular", rightColX, y + 4, { align: "center" });

  // Valores tejido adiposo
  const adipEntries = [
    ["Superior:", result.zonas.adiposo.superiorPct, y + 14],
    ["Central:", result.zonas.adiposo.centralPct, y + 29],
    ["Inferior:", result.zonas.adiposo.inferiorPct, y + 44],
  ] as const;

  adipEntries.forEach(([label, val, ey]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(label, leftColX, ey, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    doc.text(val == null ? "—" : `${val.toFixed(2).replace(".", ",")}%`, leftColX, ey + 4.5, { align: "center" });
  });

  // Valores tejido muscular
  const muscEntries = [
    ["Brazo:", result.zonas.muscular.brazoPct, y + 14],
    ["Muslo:", result.zonas.muscular.musloPct, y + 32],
    ["Pierna:", result.zonas.muscular.piernaPct, y + 46],
  ] as const;

  muscEntries.forEach(([label, val, ey]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(label, rightColX, ey, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    doc.text(val == null ? "—" : `${val.toFixed(2).replace(".", ",")}%`, rightColX, ey + 4.5, { align: "center" });
  });

  // Silueta anatómica bicolor vectorial
  const topY = y + 4;
  // Mitad izquierda (ámbar)
  doc.setFillColor(234, 179, 8);
  doc.circle(centerX, topY + 6, 3.6, "F"); // cabeza
  doc.rect(centerX - 6.5, topY + 11, 6.5, 20, "F"); // torso izq
  doc.rect(centerX - 10, topY + 12, 3.2, 16, "F"); // brazo izq
  doc.rect(centerX - 6, topY + 31, 4.8, 22, "F"); // pierna izq

  // Mitad derecha (rojo)
  doc.setFillColor(220, 38, 38);
  doc.rect(centerX, topY + 2.4, 3.6, 7.2, "F"); // mitad cabeza
  doc.rect(centerX, topY + 11, 6.5, 20, "F"); // torso der
  doc.rect(centerX + 6.8, topY + 12, 3.2, 16, "F"); // brazo der
  doc.rect(centerX + 1.2, topY + 31, 4.8, 22, "F"); // pierna der

  // Línea divisoria central blanca
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(centerX, topY + 1, centerX, topY + 54);

  // Nota de zonas predominantes debajo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  const summaryParts: string[] = [];
  if (result.zonas.adiposo.predominante) summaryParts.push(`Mayor adiposidad: ${result.zonas.adiposo.predominante}`);
  if (result.zonas.muscular.predominante) summaryParts.push(`Mayor músculo: ${result.zonas.muscular.predominante}`);
  if (summaryParts.length > 0) {
    doc.text(summaryParts.join("  ·  "), centerX, y + h - 1, { align: "center" });
  }
}

function drawCompositionIndicesBlock(
  doc: jsPDF,
  result: IsakResult,
  prev: IsakResult | null,
  prevLabel: string | null,
  x: number,
  y: number,
  w: number
) {
  const colActualX = x + w * 0.55;
  const colPrevX = x + w * 0.76;
  const colDiffX = x + w * 0.96;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Valor actual", colActualX, y, { align: "center" });
  doc.text(prevLabel ?? "Anterior", colPrevX, y, { align: "center" });
  doc.text("Diferencia", colDiffX, y, { align: "right" });

  let cy = y + 6;
  const iamVal = result.indiceAdiposoMuscular.valor;
  const iamPrev = prev?.indiceAdiposoMuscular.valor ?? null;
  const iamDiff = iamVal != null && iamPrev != null ? Math.round((iamVal - iamPrev) * 100) / 100 : null;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  doc.text("Índice adiposo muscular", x, cy);
  doc.text(iamVal != null ? fmtNum(iamVal, 2) : "—", colActualX, cy, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(iamPrev != null ? fmtNum(iamPrev, 2) : "—", colPrevX, cy, { align: "center" });
  doc.setTextColor(iamDiff != null && iamDiff < 0 ? 22 : 217, iamDiff != null && iamDiff < 0 ? 128 : 119, iamDiff != null && iamDiff < 0 ? 92 : 6);
  doc.text(iamDiff != null ? `${iamDiff > 0 ? "+" : ""}${fmtNum(iamDiff, 2)}` : "—", colDiffX, cy, { align: "right" });

  cy += 4.5;
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(`Clasificación: ${result.indiceAdiposoMuscular.clasificacion}`, x, cy);
  cy += 4;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(`Interpretación: ${result.indiceAdiposoMuscular.interpretacion}`, x, cy, { maxWidth: w });

  cy += 8;
  doc.setDrawColor(190, 210, 200);
  doc.line(x, cy, x + w, cy);
  cy += 6;

  const imoVal = result.indiceMusculoOseo.valor;
  const imoPrev = prev?.indiceMusculoOseo.valor ?? null;
  const imoDiff = imoVal != null && imoPrev != null ? Math.round((imoVal - imoPrev) * 100) / 100 : null;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  doc.text("Índice músculo/óseo", x, cy);
  doc.text(imoVal != null ? fmtNum(imoVal, 2) : "—", colActualX, cy, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(imoPrev != null ? fmtNum(imoPrev, 2) : "—", colPrevX, cy, { align: "center" });
  doc.setTextColor(imoDiff != null && imoDiff > 0 ? 22 : 217, imoDiff != null && imoDiff > 0 ? 128 : 119, imoDiff != null && imoDiff > 0 ? 92 : 6);
  doc.text(imoDiff != null ? `${imoDiff > 0 ? "+" : ""}${fmtNum(imoDiff, 2)}` : "—", colDiffX, cy, { align: "right" });

  cy += 4.5;
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(`Clasificación: ${result.indiceMusculoOseo.clasificacion}`, x, cy);
  cy += 4;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(`Interpretación: ${result.indiceMusculoOseo.interpretacion}`, x, cy);
  cy += 4;
  doc.setFontSize(7);
  doc.text("Escala: < 2,01 Muy bajo   |   2,01-2,11 Bajo   |   2,11-2,78 Medio   |   2,78-2,96 Alto   |   > 2,96 Muy alto", x, cy);
}

function drawVerticalGroupBars(
  doc: jsPDF,
  title: string,
  items: { label: string; cur: number; prev: number | null }[],
  x: number,
  y: number,
  w: number,
  h: number,
  prevLabel: string | null
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text(title, x, y + 3);

  const plotX = x + 6;
  const plotY = y + 7;
  const plotW = w - 8;
  const plotH = h - 15;
  const baseY = plotY + plotH;
  const maxV = Math.max(...items.flatMap((i) => [i.cur, i.prev ?? 0]), 10) * 1.15;

  doc.setDrawColor(190, 200, 195);
  doc.line(plotX, plotY, plotX, baseY);
  doc.line(plotX, baseY, plotX + plotW, baseY);

  const slotW = plotW / Math.max(1, items.length);
  const bw = Math.min(5, slotW * 0.34);

  items.forEach((item, idx) => {
    const cx = plotX + idx * slotW + slotW / 2;
    const hCur = (item.cur / maxV) * plotH;
    doc.setFillColor(16, 185, 129);
    doc.rect(item.prev != null ? cx - bw - 0.5 : cx - bw / 2, baseY - hCur, bw, hCur, "F");

    if (item.prev != null) {
      const hPrev = (item.prev / maxV) * plotH;
      doc.setFillColor(251, 146, 60);
      doc.rect(cx + 0.5, baseY - hPrev, bw, hPrev, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...MUTED);
    doc.text(item.label, cx, baseY + 3.5, { align: "center" });
  });

  // Leyenda
  doc.setFillColor(16, 185, 129);
  doc.rect(plotX, y + h - 3, 3, 2, "F");
  doc.setFontSize(6);
  doc.setTextColor(...DARK);
  doc.text("Actual", plotX + 4, y + h - 1.3);
  if (prevLabel) {
    doc.setFillColor(251, 146, 60);
    doc.rect(plotX + 20, y + h - 3, 3, 2, "F");
    doc.text(prevLabel, plotX + 24, y + h - 1.3);
  }
}
