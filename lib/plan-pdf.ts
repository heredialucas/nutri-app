import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

export interface PlanFoodPdf {
  name: string;
  quantity?: string | null;
  unit?: string | null;
  notes?: string | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
}

export interface PlanMealPdf {
  label: string;
  notes?: string | null;
  foods?: PlanFoodPdf[];
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
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

type RGB = [number, number, number];

const INK: RGB = [31, 41, 55];
const MUTED: RGB = [107, 114, 128];
const GREEN: RGB = [22, 128, 92];
const PALE_GREEN: RGB = [236, 253, 245];
const PURPLE: RGB = [124, 58, 237];
const PALE_PURPLE: RGB = [245, 243, 255];
const DAY_COLORS: RGB[] = [
  [37, 99, 235],
  [5, 150, 105],
  [217, 119, 6],
  [225, 29, 72],
  [124, 58, 237],
  [8, 145, 178],
  [234, 88, 12],
];

function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function quantity(food: PlanFoodPdf): string {
  return [food.quantity, food.unit].filter(Boolean).join(" ");
}

function formatDate(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

function setFont(doc: jsPDF, size: number, color: RGB, style: "normal" | "bold" | "italic" = "normal") {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
}

export function generatePlanPdf(data: PlanPdfInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = 0;

  const footer = () => {
    setFont(doc, 7.5, [148, 163, 184], "normal");
    doc.text("Mauro Acosta · Gestión nutricional", margin, pageH - 8);
    doc.text(`Página ${(doc as any).getNumberOfPages()}`, pageW - margin, pageH - 8, { align: "right" });
  };

  const newPage = () => {
    doc.addPage();
    y = 18;
  };

  const ensureSpace = (height: number) => {
    if (y + height > pageH - 18) newPage();
  };

  const sectionTitle = (label: string, color: RGB = GREEN) => {
    ensureSpace(14);
    setFont(doc, 13, color, "bold");
    doc.text(label, margin, y);
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, pageW - margin, y + 2);
    y += 10;
  };

  // Encabezado editorial.
  doc.setFillColor(24, 74, 58);
  doc.rect(0, 0, pageW, 48, "F");
  doc.setFillColor(22, 128, 92);
  doc.rect(0, 44, pageW, 4, "F");
  setFont(doc, 9, [187, 247, 208], "bold");
  doc.text("MAURO ACOSTA", margin, 15);
  setFont(doc, 8, [220, 252, 231], "normal");
  doc.text("GESTIÓN NUTRICIONAL", margin, 20);
  setFont(doc, 22, [255, 255, 255], "bold");
  doc.text("Plan alimentario", margin, 34);
  setFont(doc, 9, [220, 252, 231], "normal");
  doc.text(`Paciente: ${text(data.patientName)}`, pageW - margin, 17, { align: "right" });
  if (data.professionalName) doc.text(`Profesional: ${text(data.professionalName)}`, pageW - margin, 23, { align: "right" });
  if (data.startDate) doc.text(`Inicio: ${formatDate(data.startDate)}`, pageW - margin, 29, { align: "right" });

  y = 61;
  setFont(doc, 16, INK, "bold");
  const titleLines = doc.splitTextToSize(text(data.title), contentW * 0.72);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6 + 5;

  if (data.description) {
    const descLines = doc.splitTextToSize(text(data.description), contentW - 12);
    const boxH = Math.min(Math.max(16, descLines.length * 4.2 + 9), 38);
    ensureSpace(boxH + 4);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y - 4, contentW, boxH, 3, 3, "FD");
    setFont(doc, 9, MUTED, "normal");
    doc.text(descLines.slice(0, 6), margin + 6, y + 3);
    y += boxH + 7;
  }

  const metrics = [
    ["Energía", data.calorieTarget ? `${data.calorieTarget} kcal` : "—", [234, 88, 12] as RGB],
    ["Proteína", data.proteinTarget ? `${data.proteinTarget} g` : "—", [225, 29, 72] as RGB],
    ["Carbohidratos", data.carbTarget ? `${data.carbTarget} g` : "—", [2, 132, 199] as RGB],
    ["Grasas", data.fatTarget ? `${data.fatTarget} g` : "—", [180, 83, 9] as RGB],
  ];
  const metricGap = 3;
  const metricW = (contentW - metricGap * 3) / 4;
  ensureSpace(27);
  metrics.forEach(([label, value, color], index) => {
    const x = margin + index * (metricW + metricGap);
    const rgb = color as RGB;
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(x, y, metricW, 23, 3, 3, "FD");
    doc.setFillColor(...rgb);
    doc.roundedRect(x, y, 2.5, 23, 1.2, 1.2, "F");
    setFont(doc, 7.5, MUTED, "normal");
    doc.text(text(label), x + 6, y + 8);
    setFont(doc, 11, INK, "bold");
    doc.text(text(value), x + 6, y + 17);
  });
  y += 34;

  const days = data.days || [];
  if (days.length) {
    newPage();
    sectionTitle("Tu semana", GREEN);
  }
  days.forEach((day, dayIndex) => {
    const dayColor = DAY_COLORS[dayIndex % DAY_COLORS.length];
    const meals = day.meals || [];
    if (dayIndex > 0) newPage();

    doc.setFillColor(...dayColor);
    doc.roundedRect(margin, y, contentW, 11, 3, 3, "F");
    setFont(doc, 11, [255, 255, 255], "bold");
    doc.text(text(day.label) || `Día ${dayIndex + 1}`, margin + 6, y + 7.3);
    setFont(doc, 8, [240, 253, 250], "normal");
    doc.text(`${meals.length} ${meals.length === 1 ? "comida" : "comidas"}`, pageW - margin - 6, y + 7.3, { align: "right" });
    y += 14;

    meals.forEach((meal) => {
      const mealColor = dayColor.map((channel) => Math.min(255, channel + 25)) as RGB;
      const rows = (meal.foods || []).map((food) => [
        text(food.name),
        quantity(food),
        text(food.notes),
      ]);
      if (rows.length === 0) rows.push(["Sin alimentos", "", ""]);
      const mealH = 13.5 + rows.length * 6.8 + (meal.notes ? 14 : 0);
      if (y + mealH > pageH - 18 && mealH <= pageH - 36) newPage();
      setFont(doc, 9.5, dayColor, "bold");
      doc.text(text(meal.label) || "Comida", margin + 2, y);
      if (meal.calories || meal.protein || meal.carbs || meal.fat) {
        const totals = [
          meal.calories ? `${meal.calories} kcal` : "",
          meal.protein ? `P ${meal.protein} g` : "",
          meal.carbs ? `HC ${meal.carbs} g` : "",
          meal.fat ? `G ${meal.fat} g` : "",
        ].filter(Boolean).join(" · ");
        setFont(doc, 7.5, MUTED, "normal");
        doc.text(totals, pageW - margin, y, { align: "right" });
      }
      y += 2;
      autoTable(doc, {
        startY: y,
        margin: { left: margin + 2, right: margin + 2, top: 18, bottom: 18 },
        head: [["Alimento", "Cantidad", "Indicaciones"]],
        body: rows,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 8.5,
          textColor: INK,
          cellPadding: 1.8,
          lineColor: [229, 231, 235],
          lineWidth: 0.2,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: mealColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7.5,
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: contentW * 0.42, fontStyle: "bold" },
          1: { cellWidth: contentW * 0.2 },
          2: { cellWidth: contentW * 0.38, textColor: MUTED },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 2.5;
      if (meal.notes) {
        const lines = doc.splitTextToSize(`Indicación: ${text(meal.notes)}`, contentW - 14);
        ensureSpace(lines.length * 4 + 6);
        doc.setFillColor(255, 251, 235);
        doc.setDrawColor(253, 230, 138);
        doc.roundedRect(margin + 2, y, contentW - 4, lines.length * 4 + 5, 2, 2, "FD");
        setFont(doc, 7.8, [146, 64, 14], "italic");
        doc.text(lines, margin + 6, y + 4);
        y += lines.length * 4 + 8;
      }
    });
    y += 5;
  });

  const tips = text(data.tips).split("\n").map((tip) => tip.trim()).filter(Boolean);
  if (data.supplements?.length || data.recipes?.length || tips.length) {
    newPage();
  }

  if (data.supplements?.length) {
    sectionTitle("Suplementos", PURPLE);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin, top: 18, bottom: 18 },
      head: [["Suplemento", "Dosis", "Momento", "Frecuencia", "Indicaciones"]],
      body: data.supplements.map((supplement) => [
        text(supplement.name),
        text(supplement.dosage),
        text(supplement.timing),
        text(supplement.frequency),
        text(supplement.notes),
      ]),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 8, textColor: INK, cellPadding: 2.5, lineColor: [233, 213, 255], lineWidth: 0.2 },
      headStyles: { fillColor: PURPLE, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
      alternateRowStyles: { fillColor: PALE_PURPLE },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 36 }, 1: { cellWidth: 25 }, 2: { cellWidth: 32 }, 3: { cellWidth: 29 }, 4: { cellWidth: contentW - 122 } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  if (data.recipes?.length) {
    sectionTitle("Recetas recomendadas", [14, 116, 144]);
    data.recipes.forEach((recipe) => {
      ensureSpace(30);
      doc.setFillColor(240, 253, 250);
      doc.setDrawColor(153, 246, 228);
      doc.roundedRect(margin, y - 4, contentW, 9, 2, 2, "FD");
      setFont(doc, 10, [15, 118, 110], "bold");
      doc.text(text(recipe.title), margin + 5, y + 2);
      y += 9;
      [["Ingredientes", recipe.ingredients], ["Preparación", recipe.instructions]].forEach(([label, value]) => {
        if (!value) return;
        ensureSpace(16);
        setFont(doc, 8, MUTED, "bold");
        doc.text(text(label), margin + 2, y);
        y += 4;
        setFont(doc, 8.5, INK, "normal");
        const lines = doc.splitTextToSize(text(value), contentW - 8);
        doc.text(lines, margin + 2, y);
        y += lines.length * 4 + 4;
      });
      y += 3;
    });
  }

  if (tips.length) {
    sectionTitle("Tips para acompañar tu plan", GREEN);
    tips.forEach((tip) => {
      const lines = doc.splitTextToSize(tip, contentW - 16);
      ensureSpace(lines.length * 4 + 9);
      doc.setFillColor(...PALE_GREEN);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(margin, y - 3, contentW, lines.length * 4 + 6, 2, 2, "FD");
      doc.setFillColor(...GREEN);
      doc.circle(margin + 5, y + 1, 1.2, "F");
      setFont(doc, 8.8, INK, "normal");
      doc.text(lines, margin + 10, y + 2);
      y += lines.length * 4 + 9;
    });
  }

  for (let page = 1; page <= (doc as any).getNumberOfPages(); page++) {
    doc.setPage(page);
    footer();
  }

  const filename = `Plan-${text(data.patientName).replace(/\s+/g, "-")}.pdf`;
  doc.save(filename);
}
