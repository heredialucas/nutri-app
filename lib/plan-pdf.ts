import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

export interface PlanFoodPdf {
  name: string;
  quantity?: string | null;
  unit?: string | null;
  notes?: string | null;
}

export interface PlanMealPdf {
  label: string;
  notes?: string | null;
  foods?: PlanFoodPdf[];
}

export interface PlanDayPdf {
  label: string;
  meals?: PlanMealPdf[];
}

export interface PlanSupplementPdf {
  name: string;
  dosage?: string | null;
  timing?: string | null;
  frequency?: string | null;
  notes?: string | null;
}

export interface PlanRecipePdf {
  title: string;
  ingredients?: string | null;
  instructions?: string | null;
}

export interface PlanPdfInput {
  title: string;
  description?: string | null;
  patientName: string;
  professionalName?: string | null;
  calorieTarget?: number | null;
  proteinTarget?: number | null;
  carbTarget?: number | null;
  fatTarget?: number | null;
  notes?: string | null;
  tips?: string | null;
  startDate?: string | null;
  days?: PlanDayPdf[];
  supplements?: PlanSupplementPdf[];
  recipes?: PlanRecipePdf[];
}

const VERDE: [number, number, number] = [16, 122, 87];
const GRIS = 120;

function targetChips(data: PlanPdfInput): string {
  const chips: string[] = [];
  if (data.calorieTarget) chips.push(`${data.calorieTarget} kcal/día`);
  if (data.proteinTarget) chips.push(`${data.proteinTarget} g P`);
  if (data.carbTarget) chips.push(`${data.carbTarget} g HC`);
  if (data.fatTarget) chips.push(`${data.fatTarget} g G`);
  if (data.days?.length) chips.push(`${data.days.length} días`);
  if (data.startDate) {
    const d = new Date(data.startDate);
    if (!isNaN(d.getTime())) chips.push(`Desde ${d.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`);
  }
  return chips.join("   ·   ");
}

export function generatePlanPdf(data: PlanPdfInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Línea superior de marca
  doc.setFillColor(...VERDE);
  doc.rect(0, 0, pageW, 8, "F");

  // Encabezado
  doc.setTextColor(...VERDE);
  doc.setFontSize(19);
  doc.setFont("helvetica", "bold");
  doc.text("Plan Alimentario", margin, 24);

  doc.setFontSize(11);
  doc.setTextColor(55, 55, 55);
  doc.setFont("helvetica", "normal");
  doc.text(`Paciente: ${data.patientName}`, margin, 33);
  doc.text(`Plan: ${data.title}`, margin, 39);
  const chips = targetChips(data);
  if (chips) doc.text(chips, margin, 45);
  if (data.professionalName) doc.text(`Profesional: ${data.professionalName}`, margin, 51);
  doc.setDrawColor(200);
  doc.line(margin, 56, pageW - margin, 56);

  let y = 62;

  if (data.description) {
    doc.setFontSize(10);
    doc.setTextColor(GRIS);
    const descLines = doc.splitTextToSize(data.description, pageW - margin * 2);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 4;
  }

  const pageTitle = (t: string) => {
    if (y > pageH - 30) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...VERDE);
    doc.text(t, margin, y);
    y += 4;
  };

  // Días y comidas
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...VERDE);
  doc.text("Estructura del plan", margin, y);
  y += 2;

  (data.days || []).forEach((day) => {
    if (y > pageH - 60) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(day.label, margin, y + 3);
    const meals = day.meals || [];
    const rows = meals.flatMap((m) => {
      const foodRows = (m.foods || []).map((f) => {
        const q = [f.quantity, f.unit].filter(Boolean).join(" ");
        const txt = f.notes ? `${f.name} — ${f.notes}` : f.name;
        return [q || "", txt];
      });
      if (foodRows.length === 0) foodRows.push(["", "Sin alimentos"]);
      // Prefijo el label de la comida en la primera fila
      foodRows[0][0] = `${m.label}: ${foodRows[0][0]}`.trim();
      return foodRows;
    });

    autoTable(doc, {
      startY: y + 5,
      margin: { left: margin, right: margin },
      body: rows,
      theme: "plain",
      styles: { fontSize: 9.5, cellPadding: 1 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
    });
    y = (doc as any).lastAutoTable.finalY + 3;

    const withNotes = meals.filter((m) => m.notes);
    for (const m of withNotes) {
      if (y > pageH - 30) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(140, 100, 0);
      const noteLines = doc.splitTextToSize(`Nota (${m.label}): ${m.notes}`, pageW - margin * 2);
      doc.text(noteLines, margin, y);
      y += noteLines.length * 4 + 2;
    }
  });

  // Suplementos
  if (data.supplements && data.supplements.length > 0) {
    pageTitle("Suplementos");
    y += 1;
    const rows = data.supplements.map((s) => [
      s.name,
      [s.dosage, s.timing, s.frequency].filter(Boolean).join(" · ") || "",
      s.notes || "",
    ]);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Suplemento", "Indicación", "Notas"]],
      body: rows,
      styles: { fontSize: 9.5 },
      headStyles: { fillColor: VERDE, textColor: 255 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Recetas recomendadas
  if (data.recipes && data.recipes.length > 0) {
    pageTitle("Recetas recomendadas");
    y += 1;
    data.recipes.forEach((r) => {
      if (y > pageH - 60) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(r.title, margin, y);
      y += 4;
      if (r.ingredients) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bolditalic");
        doc.setTextColor(GRIS);
        doc.text("Ingredientes", margin, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        const l1 = doc.splitTextToSize(r.ingredients, pageW - margin * 2);
        doc.text(l1, margin, y);
        y += l1.length * 4 + 2;
      }
      if (r.instructions) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bolditalic");
        doc.setTextColor(GRIS);
        doc.text("Preparación", margin, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        const l2 = doc.splitTextToSize(r.instructions, pageW - margin * 2);
        doc.text(l2, margin, y);
        y += l2.length * 4 + 3;
      }
    });
  }

  // Tips
  const tips = (data.tips || "")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
  if (tips.length > 0) {
    pageTitle("Tips de nutrición");
    y += 1;
    tips.forEach((tip) => {
      if (y > pageH - 30) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const l = doc.splitTextToSize(`• ${tip}`, pageW - margin * 2);
      doc.text(l, margin, y);
      y += l.length * 4 + 2;
    });
  }

  // Nota del profesional
  if (data.notes) {
    pageTitle("Nota del profesional");
    y += 1;
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(GRIS);
    const l = doc.splitTextToSize(data.notes, pageW - margin * 2);
    doc.text(l, margin, y);
    y += l.length * 4 + 4;
  }

  // Pie de página
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  doc.text("Plan elaborado por Mauro Acosta — Gestión nutricional.", margin, pageH - 8);

  const nombreArchivo = `Plan-${data.patientName.replace(/\s+/g, "-")}.pdf`;
  doc.save(nombreArchivo);
}
