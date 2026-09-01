"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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

type PdfDocument = jsPDF & { lastAutoTable?: { finalY: number } };
const GREEN: [number, number, number] = [19, 128, 91];
const DARK: [number, number, number] = [28, 43, 37];
const MUTED: [number, number, number] = [93, 108, 101];
const LIGHT: [number, number, number] = [242, 247, 244];
const AMBER: [number, number, number] = [183, 115, 24];

export function IsakPdfButton({ result, paciente, fecha, evaluador, evolutionData = [] }: PdfPayload & { result: IsakResult }) {
  const generatePdf = () => {
    try {
      const validEvolutionData = (evolutionData ?? []).filter((item): item is { date: string; result: IsakResult } => Boolean(item?.date && item?.result));
      const doc = new jsPDF({ unit: "mm", format: "a4" }) as PdfDocument;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 16;
      const contentWidth = pageWidth - margin * 2;

      drawPageChrome(doc, paciente, fecha, evaluador);
      doc.setFillColor(...GREEN);
      doc.rect(0, 0, pageWidth, 5, "F");
      doc.setTextColor(...GREEN);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("MAURO ACOSTA", margin, 20);
      doc.setTextColor(...DARK);
      doc.setFontSize(25);
      doc.text("Informe antropométrico", margin, 34);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...MUTED);
      doc.text("Gestión nutricional · Evaluación corporal ISAK", margin, 42);
      doc.setDrawColor(215, 226, 219);
      doc.line(margin, 49, pageWidth - margin, 49);
      doc.setTextColor(...DARK);
      doc.setFontSize(11);
      doc.text("Paciente", margin, 60);
      doc.setFont("helvetica", "bold");
      doc.text(paciente, margin, 67);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
      doc.text(`Fecha: ${fecha}`, pageWidth - margin, 60, { align: "right" });
      doc.text(`Evaluado por: ${evaluador}`, pageWidth - margin, 67, { align: "right" });

      sectionTitle(doc, "Resumen de la evaluación", margin, 86);
      const cards = [
        ["Peso", `${result.datos.peso} kg`, result.datos.imcClasificacion],
        ["IMC", `${result.datos.imc} kg/m²`, result.datos.imcClasificacion],
        ["Masa adiposa", `${result.fraccionamiento.masaAdiposaPct ?? "—"}%`, "Estimación"],
        ["Masa muscular", `${result.fraccionamiento.masaMuscularPct ?? "—"}%`, "Estimación"],
      ];
      cards.forEach(([label, amount, note], index) => {
        const width = (contentWidth - 9) / 4;
        const x = margin + index * (width + 3);
        doc.setFillColor(...LIGHT);
        doc.roundedRect(x, 93, width, 29, 2.5, 2.5, "F");
        doc.setTextColor(...MUTED); doc.setFontSize(8); doc.text(label, x + 4, 101);
        doc.setTextColor(...DARK); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(amount, x + 4, 111);
        doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED); doc.setFontSize(7); doc.text(note, x + 4, 117);
      });

      sectionTitle(doc, "Lectura general", margin, 142);
      const waist = result.salud.find((item) => item.nombre === "Perímetro cintura");
      const readingRows = [
        ["Relación peso-altura", `${result.datos.imc} kg/m²`, result.datos.imcClasificacion, status(result.datos.imcClasificacion)],
        ["Cintura", waist ? `${waist.valor} cm` : "Sin dato", waist?.interpretacion ?? "No disponible", status(waist?.interpretacion)],
        ["Índice adiposo-muscular", result.indiceAdiposoMuscular.valor == null ? "Sin dato" : String(result.indiceAdiposoMuscular.valor), result.indiceAdiposoMuscular.clasificacion, status(result.indiceAdiposoMuscular.clasificacion)],
      ];
      autoTable(doc, { startY: 149, head: [["Área", "Resultado", "Interpretación", "Estado"]], body: readingRows, theme: "plain", margin: { left: margin, right: margin }, styles: tableStyles(), headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: "bold" }, alternateRowStyles: { fillColor: [248, 250, 249] }, columnStyles: { 0: { cellWidth: 43 }, 1: { cellWidth: 35 }, 2: { cellWidth: 75 }, 3: { cellWidth: 25 } } });
      const finalY = doc.lastAutoTable?.finalY ?? 190;
      noteBox(doc, "Cómo leer este informe", "Los valores permiten comparar tu evolución entre controles. Las estimaciones y clasificaciones son orientativas y se interpretan durante la consulta, nunca como diagnóstico aislado.", margin, finalY + 12, contentWidth);

      doc.addPage();
      drawPageChrome(doc, paciente, fecha, evaluador);
      sectionTitle(doc, "Indicadores y referencias", margin, 24);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...MUTED);
      doc.text("Referencias orientativas según el indicador registrado y el perfil de la persona.", margin, 31);
      const healthRows = result.salud.map((item) => [item.nombre, item.valor, item.unidad || "—", item.rangoSaludable, status(item.interpretacion), item.interpretacion]);
      healthRows.push(["Índice adiposo-muscular", result.indiceAdiposoMuscular.valor ?? "Sin dato", "—", "< 0,35 muy bueno · 0,35–0,45 bueno · 0,46–0,55 aceptable", status(result.indiceAdiposoMuscular.clasificacion), result.indiceAdiposoMuscular.clasificacion]);
      autoTable(doc, { startY: 39, head: [["Indicador", "Valor", "Unidad", "Referencia", "Estado", "Lectura"]], body: healthRows, theme: "striped", margin: { left: margin, right: margin }, styles: tableStyles(7.5), headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: "bold" }, alternateRowStyles: { fillColor: [247, 250, 248] }, columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 17 }, 2: { cellWidth: 13 }, 3: { cellWidth: 42 }, 4: { cellWidth: 27 }, 5: { cellWidth: 49 } } });
      noteBox(doc, "Importante", "Un rango de referencia no reemplaza la valoración clínica. Edad, sexo, antecedentes, objetivos y evolución modifican la lectura de cada indicador.", margin, (doc.lastAutoTable?.finalY ?? 100) + 10, contentWidth);

      doc.addPage();
      drawPageChrome(doc, paciente, fecha, evaluador);
      sectionTitle(doc, "Mediciones registradas", margin, 24);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...MUTED);
      doc.text("Detalle de las mediciones utilizadas para construir este informe.", margin, 31);
      const measurementRows = [
        ["Datos generales", "Peso", result.datos.peso, "kg", ""],
        ["Datos generales", "Talla", result.datos.talla, "cm", ""],
        ...result.adiposidad.porPliegue.map((item) => ["Pliegue cutáneo", item.nombre, item.valor, "mm", "Medición ISAK"]),
        ["Pliegues", "Sumatorio de 6 pliegues", result.sumatorio6Pliegues ?? "Sin dato", "mm", "Seguimiento de tendencia"],
        ...result.mediciones.perimetros.map((item) => ["Perímetro", item.nombre, item.valor ?? "Sin dato", "cm", "Medición ISAK"]),
        ["Perímetro corregido", "Brazo", result.distribucion.brazoCorregido ?? "Sin dato", "cm", "Descontando pliegue"],
        ["Perímetro corregido", "Muslo", result.distribucion.musloCorregido ?? "Sin dato", "cm", "Descontando pliegue"],
        ["Perímetro corregido", "Pierna", result.distribucion.piernaCorregida ?? "Sin dato", "cm", "Descontando pliegue"],
        ["Diámetro óseo", "Biepicondíleo de húmero · codo", result.diametros.humerusBreadth ?? "Sin dato", "mm", "Estructural"],
        ["Diámetro óseo", "Biestiloideo de muñeca · radio-cúbito", result.diametros.biStyloidWrist ?? "Sin dato", "mm", "Estructural"],
        ["Diámetro óseo", "Biepicondíleo de fémur · rodilla", result.diametros.femurBreadth ?? "Sin dato", "mm", "Estructural"],
      ];
      autoTable(doc, { startY: 39, head: [["Grupo", "Medición", "Valor", "Unidad", "Observación"]], body: measurementRows, theme: "striped", margin: { left: margin, right: margin }, styles: tableStyles(8), headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: "bold" }, alternateRowStyles: { fillColor: [247, 250, 248] }, columnStyles: { 0: { cellWidth: 34 }, 1: { cellWidth: 67 }, 2: { cellWidth: 22 }, 3: { cellWidth: 16 }, 4: { cellWidth: 40 } } });
      let nextY = (doc.lastAutoTable?.finalY ?? 150) + 12;
      sectionTitle(doc, "Composición y energía", margin, nextY);
      nextY += 5;
      autoTable(doc, { startY: nextY, head: [["Componente", "Resultado", "Método / nota"]], body: [["Masa adiposa", `${result.fraccionamiento.masaAdiposaKg ?? "Sin dato"} kg · ${result.fraccionamiento.masaAdiposaPct ?? "Sin dato"}%`, "Kerr / Ross · estimación"], ["Masa muscular", `${result.fraccionamiento.masaMuscularKg ?? "Sin dato"} kg · ${result.fraccionamiento.masaMuscularPct ?? "Sin dato"}%`, "Lee et al. · estimación"], ["Otros tejidos", `${result.fraccionamiento.otrosTejidosKg ?? "Sin dato"} kg · ${result.fraccionamiento.otrosPct ?? "Sin dato"}%`, "Modelo de 5 componentes"], ["Metabolismo basal", `${result.gastoEnergetico.metabolismoBasal ?? "Sin dato"} kcal`, result.gastoEnergetico.metodo], ["Gasto energético total", `${result.gastoEnergetico.gastoTotal ?? "Sin dato"} kcal`, result.gastoEnergetico.nivelActividad]], theme: "plain", margin: { left: margin, right: margin }, styles: tableStyles(8), headStyles: { fillColor: AMBER, textColor: [255, 255, 255], fontStyle: "bold" }, alternateRowStyles: { fillColor: [255, 249, 239] } });

      if (validEvolutionData.length > 0) {
        doc.addPage();
        drawPageChrome(doc, paciente, fecha, evaluador);
        sectionTitle(doc, "Evolución entre controles", margin, 24);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...MUTED);
        doc.text("La tendencia ayuda a contextualizar cada medición y orientar el próximo objetivo.", margin, 31);
        const evolutionRows = [...validEvolutionData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((item) => [new Date(item.date).toLocaleDateString("es-AR"), item.result.datos.peso, item.result.datos.imc, item.result.fraccionamiento.masaAdiposaPct ?? "—", item.result.fraccionamiento.masaMuscularPct ?? "—", item.result.sumatorio6Pliegues ?? "—"]);
        autoTable(doc, { startY: 39, head: [["Fecha", "Peso (kg)", "IMC", "Adiposa (%)", "Muscular (%)", "Pliegues (mm)"]], body: evolutionRows, theme: "striped", margin: { left: margin, right: margin }, styles: tableStyles(8), headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: "bold" }, alternateRowStyles: { fillColor: [247, 250, 248] } });
        const chartY = (doc.lastAutoTable?.finalY ?? 75) + 18;
        drawTrendChart(doc, "Peso", validEvolutionData, (item) => item.result.datos.peso, margin, chartY, contentWidth, "kg", [37, 99, 235]);
        drawTrendChart(doc, "Masa adiposa y muscular", validEvolutionData, (item) => item.result.fraccionamiento.masaAdiposaPct, margin, chartY + 68, contentWidth, "%", [220, 91, 72], (item) => item.result.fraccionamiento.masaMuscularPct);
      }

      doc.addPage();
      drawPageChrome(doc, paciente, fecha, evaluador);
      sectionTitle(doc, "Metodología y observaciones", margin, 24);
      const methodology = [
        ["Unidades", "Pliegues y diámetros en milímetros; perímetros en centímetros; peso en kilogramos."],
        ["Diámetros óseos", "Biepicondíleo de húmero (codo), biestiloideo de muñeca (radio-cúbito) y biepicondíleo de fémur (rodilla). Son medidas estructurales y no se clasifican como buenas o malas."],
        ["Modelo corporal", "Fraccionamiento estimado según el modelo de cinco componentes de Ross y Kerr. La masa muscular utiliza el modelo de Lee et al."],
        ["Interpretación", "Los rangos son orientativos. La valoración debe considerar contexto clínico, objetivos, antecedentes y cambios entre controles."],
        ["Profesional", "Informe generado para acompañar la consulta de Mauro Acosta · Gestión nutricional."],
      ];
      autoTable(doc, { startY: 34, head: [["Tema", "Detalle"]], body: methodology, theme: "plain", margin: { left: margin, right: margin }, styles: tableStyles(9), headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: "bold" }, alternateRowStyles: { fillColor: [247, 250, 248] }, columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 129 } } });
      noteBox(doc, "Observaciones de la evaluación", "Registrar aquí las recomendaciones y acuerdos definidos durante la consulta.", margin, (doc.lastAutoTable?.finalY ?? 100) + 15, contentWidth, 38);

      doc.save(`Informe-antropometrico-${paciente.replace(/\s+/g, "-")}-${fecha.replaceAll("/", "-")}.pdf`);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo generar el informe antropométrico");
    }
  };

  return <Button onClick={generatePdf} variant="outline"><Download className="mr-2 h-4 w-4" />Exportar informe antropométrico</Button>;
}

function drawPageChrome(doc: jsPDF, paciente: string, fecha: string, evaluador: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const page = doc.getNumberOfPages();
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...MUTED);
  doc.text("Mauro Acosta · Gestión nutricional", 16, pageHeight - 12);
  doc.text(`${paciente} · ${fecha}`, pageWidth - 16, pageHeight - 12, { align: "right" });
  doc.setDrawColor(220, 229, 223); doc.line(16, pageHeight - 17, pageWidth - 16, pageHeight - 17);
  doc.text(`Página ${page}`, pageWidth / 2, pageHeight - 7, { align: "center" });
  void evaluador;
}

function sectionTitle(doc: jsPDF, title: string, x: number, y: number) {
  doc.setTextColor(...GREEN); doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text(title, x, y);
}

function tableStyles(fontSize = 8) {
  return { font: "helvetica", fontSize, textColor: DARK, cellPadding: 2.5, lineColor: [224, 232, 226] as [number, number, number], lineWidth: 0.15, valign: "middle" as const };
}

function noteBox(doc: jsPDF, title: string, text: string, x: number, y: number, width: number, height = 27) {
  const pageWidth = doc.internal.pageSize.getWidth();
  if (y + height > doc.internal.pageSize.getHeight() - 22) { doc.addPage(); y = 25; drawPageChrome(doc, "", "", ""); }
  doc.setFillColor(248, 250, 248); doc.setDrawColor(214, 228, 218); doc.roundedRect(x, y, width, height, 2, 2, "FD");
  doc.setTextColor(...DARK); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text(title, x + 5, y + 9);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text(doc.splitTextToSize(text, width - 10), x + 5, y + 17);
  void pageWidth;
}

function status(value?: string) {
  if (!value) return "Sin dato";
  if (/obesidad|elevado|alto|sobrepeso|encima|bajo peso/i.test(value)) return "Para observar";
  if (/normopeso|óptimo|saludable|bajo|bueno|aceptable|muy bueno/i.test(value)) return "Dentro de referencia";
  return "Interpretar en consulta";
}

function drawTrendChart(doc: jsPDF, title: string, data: { date: string; result: IsakResult }[], getValue: (item: { date: string; result: IsakResult }) => number | null, x: number, y: number, width: number, unit: string, color: [number, number, number], getSecond?: (item: { date: string; result: IsakResult }) => number | null) {
  const points = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const values = points.flatMap((item) => [getValue(item), getSecond?.(item)]).filter((item): item is number => item != null && Number.isFinite(item));
  if (!values.length) return;
  const height = 42; const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1;
  doc.setTextColor(...DARK); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text(title, x, y);
  doc.setDrawColor(220, 228, 223); doc.line(x, y + height, x + width, y + height); doc.line(x, y + 7, x, y + height);
  const drawLine = (getter: (item: { date: string; result: IsakResult }) => number | null, stroke: [number, number, number]) => {
    doc.setDrawColor(...stroke); doc.setFillColor(...stroke); doc.setLineWidth(0.8);
    points.forEach((item, index) => { const current = getter(item); if (current == null) return; const px = x + (points.length === 1 ? width / 2 : index / (points.length - 1) * width); const py = y + height - 5 - ((current - min) / range) * (height - 12); doc.circle(px, py, 1.4, "F"); const nextPoint = points[index + 1]; const next = nextPoint ? getter(nextPoint) : null; if (next != null) { const nx = x + (points.length === 1 ? width / 2 : (index + 1) / (points.length - 1) * width); const ny = y + height - 5 - ((next - min) / range) * (height - 12); doc.line(px, py, nx, ny); } });
  };
  drawLine(getValue, color); if (getSecond) drawLine(getSecond, GREEN);
  doc.setTextColor(...MUTED); doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.text(`${min.toFixed(1)} ${unit}`, x, y + height + 7); doc.text(`${max.toFixed(1)} ${unit}`, x + width - 18, y + 5);
}
