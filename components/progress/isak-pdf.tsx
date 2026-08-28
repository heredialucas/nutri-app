"use client";

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { IsakResult } from "@/lib/isak/calculations";

interface PdfPayload {
  paciente: string;
  fecha: string;
  evaluador: string;
}

export function IsakPdfButton({
  result,
  paciente,
  fecha,
  evaluador,
}: PdfPayload & { result: IsakResult }) {
  const generarPdf = () => {
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 14;

      // Encabezado / marca
      doc.setFillColor(16, 122, 87);
      doc.rect(0, 0, pageW, 8, "F");
      doc.setTextColor(16, 122, 87);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Informe Corporal Antropométrico", margin, 22);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Paciente: ${paciente}`, margin, 30);
      doc.text(`Fecha: ${fecha}`, margin, 36);
      doc.text(`Evaluación ISAK — ${result.datos.genero}`, margin, 42);
      doc.text(`Evaluado por: ${evaluador}`, margin, 48);
      doc.setDrawColor(200);
      doc.line(margin, 52, pageW - margin, 52);

      let y = 58;

      // 1. Datos básicos
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 122, 87);
      doc.text("Medidas básicas", margin, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Masa corporal (kg)", "Talla (cm)", "Edad (años)", "IMC (kg/m²)", "Clasificación"]],
        body: [[
          String(result.datos.peso),
          String(result.datos.talla),
          String(result.datos.edad),
          String(result.datos.imc),
          result.datos.imcClasificacion,
        ]],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [16, 122, 87], textColor: 255 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // 2. Sumatorio de pliegues
      const filaSuma = result.adiposidad.porPliegue.map((p) => String(p.valor));
      filaSuma.push(String(result.sumatorio6Pliegues ?? ""));
      doc.setFontSize(13);
      doc.text("Sumatorio de 6 pliegues (mm)", margin, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Tríceps", "Subescapular", "Supraespinal", "Abdominal", "Muslo", "Pierna", "Total"]],
        body: [filaSuma],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [16, 122, 87], textColor: 255 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // 3. Fraccionamiento tisular
      doc.setFontSize(13);
      doc.text("Fraccionamiento tisular (modelo de 5 componentes)", margin, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Masa adiposa (Kerr, 1991)", "Masa muscular (Lee, 2000)", "Otros tejidos"]],
        body: [[
          `${result.fraccionamiento.masaAdiposaKg ?? "—"} kg (${result.fraccionamiento.masaAdiposaPct ?? "—"} %)`,
          `${result.fraccionamiento.masaMuscularKg ?? "—"} kg (${result.fraccionamiento.masaMuscularPct ?? "—"} %)`,
          `${result.fraccionamiento.otrosTejidosKg ?? "—"} kg (${result.fraccionamiento.otrosPct ?? "—"} %)`,
        ]],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [16, 122, 87], textColor: 255 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // 4. Distribución adiposo-muscular
      doc.setFontSize(13);
      doc.text("Perímetros corregidos (cm)", margin, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Brazo corregido", "Muslo corregido", "Pierna corregida"]],
        body: [[
          String(result.distribucion.brazoCorregido ?? "—"),
          String(result.distribucion.musloCorregido ?? "—"),
          String(result.distribucion.piernaCorregida ?? "—"),
        ]],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [16, 122, 87], textColor: 255 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // 5. Índice adiposo muscular
      doc.setFontSize(13);
      doc.text("Índice adiposo muscular", margin, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Valor", "Clasificación", "Interpretación"]],
        body: [[
          String(result.indiceAdiposoMuscular.valor ?? "—"),
          result.indiceAdiposoMuscular.clasificacion,
          result.indiceAdiposoMuscular.interpretacion,
        ]],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [16, 122, 87], textColor: 255 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // 6. Gasto energético
      doc.setFontSize(13);
      doc.text("Estimación de gasto energético", margin, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Metabolismo basal (kcal)", "Gasto total estimado (kcal)", "Nivel de actividad"]],
        body: [[
          String(result.gastoEnergetico.metabolismoBasal ?? "—"),
          String(result.gastoEnergetico.gastoTotal ?? "—"),
          result.gastoEnergetico.nivelActividad,
        ]],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [16, 122, 87], textColor: 255 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // 7. Índices de salud
      doc.setFontSize(13);
      doc.text("Índices de salud", margin, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Indicador", "Valor", "Rango saludable", "Interpretación"]],
        body: result.salud.map((s) => [
          s.nombre,
          `${s.valor} ${s.unidad}`.trim(),
          s.rangoSaludable,
          s.interpretacion,
        ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [16, 122, 87], textColor: 255 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // 8. Índices de rendimiento
      doc.setFontSize(13);
      doc.text("Índices de rendimiento", margin, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Diferencia brazo contraído - relajado (cm)", "Área superficie corporal (m²)", "Índice pérdida de calor (IPC)"]],
        body: [[
          String(result.rendimiento.diferenciaBrazo ?? "—"),
          String(result.rendimiento.areaSuperficie ?? "—"),
          String(result.rendimiento.indicePerdidaCalor ?? "—"),
        ]],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [16, 122, 87], textColor: 255 },
      });

      // Pie de página
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(140, 140, 140);
      doc.text(
        "Resultados calculados con el modelo de 5 componentes de Ross & Kerr (1991), Lee et al. (2000) y Harris & Benedict (1919).",
        margin,
        pageH - 10
      );

      const nombreArchivo = `Informe-ISAK-${paciente.replace(/\s+/g, "-")}-${fecha}.pdf`;
      doc.save(nombreArchivo);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo generar el PDF");
    }
  };

  return (
    <Button onClick={generarPdf} variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Exportar PDF
    </Button>
  );
}
