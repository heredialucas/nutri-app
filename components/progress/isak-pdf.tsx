"use client";

import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { IsakResult } from "@/lib/isak/calculations";

interface PdfPayload {
  paciente: string;
  fecha: string;
  evaluador: string;
  evolutionData?: { date: string; result: IsakResult }[];
}

const GREEN: [number, number, number] = [19, 128, 91];
const INK: [number, number, number] = [31, 42, 38];
const MUTED: [number, number, number] = [100, 112, 106];

export function IsakPdfButton({ result, paciente, fecha, evaluador, evolutionData = [] }: PdfPayload & { result: IsakResult }) {
  const generarPdf = () => {
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 16;
      const contentW = pageW - margin * 2;

      // Página 1: resumen que puede leer cualquier paciente.
      doc.setFillColor(...GREEN);
      doc.rect(0, 0, pageW, 10, "F");
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(23);
      doc.text("Tu evolución corporal", margin, 28);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...MUTED);
      doc.text(`${paciente} · ${fecha}`, margin, 36);
      doc.text("Un resumen simple de tu evaluación nutricional", margin, 42);

      const cards = [
        ["Peso", `${result.datos.peso} kg`, result.datos.imcClasificacion],
        ["Tejido adiposo", result.fraccionamiento.masaAdiposaPct == null ? "—" : `${result.fraccionamiento.masaAdiposaPct}%`, "Estimado"],
        ["Masa muscular", result.fraccionamiento.masaMuscularPct == null ? "—" : `${result.fraccionamiento.masaMuscularPct}%`, "Estimado"],
      ];
      cards.forEach(([label, value, note], index) => {
        const x = margin + index * ((contentW + 6) / 3);
        const w = (contentW - 12) / 3;
        doc.setFillColor(244, 249, 246);
        doc.roundedRect(x, 51, w, 30, 3, 3, "F");
        doc.setTextColor(...MUTED); doc.setFontSize(9); doc.text(label, x + 5, 59);
        doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text(value, x + 5, 70);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...MUTED); doc.text(note, x + 5, 76);
      });

      let y = 95;
      sectionTitle(doc, "Lo más importante", margin, y);
      y += 8;
      const waist = result.salud.find((item) => item.nombre === "Perímetro cintura");
      const bmi = result.salud.find((item) => item.nombre === "IMC");
      const items = [
        ["Peso y altura", `${result.datos.imc} kg/m²`, bmi?.interpretacion ?? "Se observa junto con el resto de tus medidas", statusFor(bmi?.interpretacion)],
        ["Cintura", waist ? `${waist.valor} cm` : "—", "Ayuda a seguir cambios en la zona abdominal", statusFor(waist?.interpretacion)],
        ["Cambio corporal", result.indiceAdiposoMuscular.valor == null ? "—" : `${result.indiceAdiposoMuscular.valor}`, "Compara tejido adiposo y músculo", statusFor(result.indiceAdiposoMuscular.clasificacion)],
      ];
      items.forEach(([label, value, explanation, status]) => {
        const statusColor = status === "Bien" ? [218, 245, 229] : status === "Para observar" ? [255, 242, 204] : [255, 232, 225];
        doc.setFillColor(248, 249, 248); doc.roundedRect(margin, y, contentW, 22, 3, 3, "F");
        doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text(label, margin + 6, y + 8);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...MUTED); doc.text(String(explanation), margin + 6, y + 15);
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]); doc.roundedRect(pageW - margin - 32, y + 6, 26, 9, 4, 4, "F");
        doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text(String(status), pageW - margin - 29, y + 12);
        y += 26;
      });

      doc.setFillColor(255, 248, 235); doc.roundedRect(margin, y + 3, contentW, 25, 3, 3, "F");
      doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("¿Cómo leer este informe?", margin + 6, y + 12);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...MUTED);
      doc.text("Lo más útil es mirar cómo cambian tus valores entre controles. Una medición aislada no cuenta toda la historia.", margin + 6, y + 20);

      if (evolutionData.length) {
        doc.addPage();
        drawPatientChart(doc, "Cambios en tu peso", evolutionData.map((item) => ({ date: item.date, value: item.result.datos.peso })), margin, 28, contentW, "kg", [37, 99, 235]);
        drawPatientChart(doc, "Tejido adiposo y masa muscular", evolutionData.map((item) => ({ date: item.date, value: item.result.fraccionamiento.masaAdiposaPct, second: item.result.fraccionamiento.masaMuscularPct })), margin, 102, contentW, "%", [231, 111, 81]);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...MUTED); doc.text("Rojo: tejido adiposo · Verde: masa muscular", margin, 176);
      }

      // Página final: solo datos útiles, sin fórmulas ni jerga técnica.
      doc.addPage();
      sectionTitle(doc, "Tus medidas", margin, 25);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...MUTED);
      doc.text("Estos números sirven para comparar tu proceso en los próximos controles.", margin, 33);
      const rows = [
        ["Peso", `${result.datos.peso} kg`], ["Altura", `${result.datos.talla} cm`], ["Relación peso-altura", `${result.datos.imc} · ${result.datos.imcClasificacion}`],
        ["Tejido adiposo estimado", `${result.fraccionamiento.masaAdiposaKg ?? "—"} kg · ${result.fraccionamiento.masaAdiposaPct ?? "—"}%`],
        ["Masa muscular estimada", `${result.fraccionamiento.masaMuscularKg ?? "—"} kg · ${result.fraccionamiento.masaMuscularPct ?? "—"}%`],
        ["Cintura", waist ? `${waist.valor} cm` : "—"], ["Suma de pliegues", result.sumatorio6Pliegues == null ? "—" : `${result.sumatorio6Pliegues} mm`],
      ];
      rows.forEach(([label, value], index) => {
        const rowY = 44 + index * 14;
        if (index % 2 === 0) { doc.setFillColor(247, 249, 248); doc.roundedRect(margin, rowY - 7, contentW, 12, 2, 2, "F"); }
        doc.setTextColor(...MUTED); doc.setFontSize(9); doc.text(label, margin + 5, rowY);
        doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.text(value, pageW - margin - 5, rowY, { align: "right" });
        doc.setFont("helvetica", "normal");
      });
      doc.setFillColor(244, 249, 246); doc.roundedRect(margin, 155, contentW, 35, 3, 3, "F");
      doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("A tener en cuenta", margin + 6, 166);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...MUTED);
      doc.text("Las estimaciones de tejido adiposo y masa muscular ayudan a seguir tendencias.", margin + 6, 175);
      doc.text("No son un diagnóstico y siempre se interpretan durante la consulta con Mauro Acosta.", margin + 6, 183);
      doc.setFontSize(8); doc.text(`Evaluado por ${evaluador}`, margin, 270); doc.text("Gestión nutricional · Mauro Acosta", margin, 277);

      doc.save(`Evolucion-corporal-${paciente.replace(/\s+/g, "-")}-${fecha}.pdf`);
    } catch (error) {
      console.error(error); toast.error("No se pudo generar el PDF");
    }
  };

  return <Button onClick={generarPdf} variant="outline"><Download className="mr-2 h-4 w-4" />Descargar informe simple</Button>;
}

function sectionTitle(doc: jsPDF, title: string, x: number, y: number) {
  doc.setTextColor(...GREEN); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text(title, x, y);
}

function statusFor(value?: string) {
  if (!value) return "Sin dato";
  if (/normopeso|óptimo|bajo|bueno|saludable/i.test(value)) return "Bien";
  if (/alto|elevado|sobrepeso|obesidad|encima/i.test(value)) return "Para observar";
  return "En proceso";
}

function drawPatientChart(doc: jsPDF, title: string, points: { date: string; value: number | null; second?: number | null }[], x: number, y: number, width: number, unit: string, color: [number, number, number]) {
  const height = 43;
  const values = points.flatMap((point) => [point.value, point.second]).filter((value): value is number => value != null && Number.isFinite(value));
  if (!values.length) return;
  const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1;
  doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(title, x, y);
  doc.setDrawColor(220, 226, 222); doc.setLineWidth(0.3); doc.line(x, y + height, x + width, y + height); doc.line(x, y + 8, x, y + height);
  const drawLine = (key: "value" | "second", stroke: [number, number, number]) => {
    doc.setDrawColor(...stroke); doc.setFillColor(...stroke); doc.setLineWidth(0.8);
    points.forEach((point, index) => {
      if (point[key] == null) return;
      const px = x + (points.length === 1 ? width / 2 : index / (points.length - 1) * width);
      const py = y + height - 5 - ((point[key]! - min) / range) * (height - 12);
      doc.circle(px, py, 1.5, "F");
      const next = points[index + 1]?.[key];
      if (next != null) { const nx = x + (points.length === 1 ? width / 2 : (index + 1) / (points.length - 1) * width); const ny = y + height - 5 - ((next - min) / range) * (height - 12); doc.line(px, py, nx, ny); }
    });
  };
  drawLine("value", color); if (points.some((point) => point.second != null)) drawLine("second", GREEN);
  doc.setTextColor(...MUTED); doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.text(`${min.toFixed(1)} ${unit}`, x, y + height + 8); doc.text(`${max.toFixed(1)} ${unit}`, x + width - 18, y + 5);
}
