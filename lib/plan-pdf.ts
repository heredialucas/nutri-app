import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { loadLogoDataUrl, LOGO_WHITE_SRC, LOGO_DARK_SRC } from "@/lib/pdf-branding";

export interface PlanFoodPdf {
  name: string;
  quantity?: string | null;
  unit?: string | null;
  equivalence?: string | null;
  notes?: string | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
}

export interface PlanMealPdf {
  label: string;
  title?: string | null;
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
const GREEN_DARK: RGB = [24, 74, 58];
const GREEN_MEDIUM: RGB = [15, 118, 110];
const GREEN_SOFT: RGB = [167, 214, 194];
const PALE_GREEN: RGB = [236, 253, 245];
const PALE_GREEN_ALT: RGB = [240, 250, 245];

// Los logos tienen 688 x 363 px.
const LOGO_ASPECT = 363 / 688;

interface Density {
  fontSize: number;
  padding: number;
  rowH: number;
  headH: number;
  lineGap: number;
}

// De más aireado a más compacto. Se elige el primero que entre en una hoja.
const DENSITIES: Density[] = [
  { fontSize: 9.2, padding: 2.9, rowH: 9.8, headH: 7.8, lineGap: 7.5 },
  { fontSize: 8.8, padding: 2.5, rowH: 8.8, headH: 7.4, lineGap: 7 },
  { fontSize: 8.4, padding: 2.1, rowH: 7.9, headH: 7.0, lineGap: 6.5 },
  { fontSize: 8.0, padding: 1.7, rowH: 7.0, headH: 6.6, lineGap: 6 },
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

function setOpacity(doc: jsPDF, opacity: number) {
  try {
    const GState = (doc as any).GState;
    if (GState) doc.setGState(new GState({ opacity }));
  } catch {
    // Si el visor no soporta GState, se dibuja sin opacidad.
  }
}

function estimateDayHeight(meals: PlanMealPdf[], density: Density): number {
  let height = 0;
  for (const meal of meals) {
    const rows = Math.max(1, (meal.foods || []).length);
    height += 4 + density.headH + rows * density.rowH;
    if (meal.notes) height += 10;
    height += density.lineGap;
  }
  return height;
}

export async function generatePlanPdf(data: PlanPdfInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = 0;

  let logoDataUrl: string | null = null;
  let darkLogoDataUrl: string | null = null;
  try {
    logoDataUrl = await loadLogoDataUrl(LOGO_WHITE_SRC);
  } catch {
    logoDataUrl = null;
  }
  try {
    darkLogoDataUrl = await loadLogoDataUrl(LOGO_DARK_SRC);
  } catch {
    darkLogoDataUrl = null;
  }

  // Marca de agua: logo oscuro, grande, muy transparente, en todas las hojas.
  const watermark = (page: number) => {
    if (!darkLogoDataUrl) return;
    doc.setPage(page);
    const w = 158;
    const h = w * LOGO_ASPECT;
    setOpacity(doc, 0.05);
    try {
      doc.addImage(darkLogoDataUrl, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
    } catch {
      // Sin logo no se dibuja la marca de agua.
    }
    setOpacity(doc, 1);
  };

  const footer = (page: number) => {
    setFont(doc, 7.5, [148, 163, 184], "normal");
    doc.text("Mauro Acosta · Nutricionista", margin, pageH - 8);
    doc.text(`Página ${page}`, pageW - margin, pageH - 8, { align: "right" });
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
  doc.setFillColor(...GREEN_DARK);
  doc.rect(0, 0, pageW, 48, "F");
  doc.setFillColor(...GREEN);
  doc.rect(0, 44, pageW, 4, "F");
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", pageW - margin - 30, 10, 30, 15.8);
    } catch {
      // Si el logo falla, el encabezado textual mantiene la marca.
    }
  }
  setFont(doc, 9, [187, 247, 208], "bold");
  doc.text("MAURO ACOSTA", margin, 15);
  setFont(doc, 8, [220, 252, 231], "normal");
  doc.text("NUTRICIONISTA", margin, 20);
  setFont(doc, 22, [255, 255, 255], "bold");
  doc.text("Plan alimentario", margin, 34);
  setFont(doc, 9, [220, 252, 231], "normal");
  const rightX = logoDataUrl ? pageW - margin - 40 : pageW - margin;
  doc.text(`Paciente: ${text(data.patientName)}`, rightX, 17, { align: "right" });
  if (data.professionalName) doc.text(`Profesional: ${text(data.professionalName)}`, rightX, 23, { align: "right" });
  if (data.startDate) doc.text(`Inicio: ${formatDate(data.startDate)}`, rightX, 29, { align: "right" });

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
    ["Energía", data.calorieTarget ? `${data.calorieTarget} kcal` : "—", GREEN as RGB],
    ["Proteína", data.proteinTarget ? `${data.proteinTarget} g` : "—", GREEN as RGB],
    ["Carbohidratos", data.carbTarget ? `${data.carbTarget} g` : "—", GREEN as RGB],
    ["Grasas", data.fatTarget ? `${data.fatTarget} g` : "—", GREEN as RGB],
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

  // Logo grande en el espacio libre de la portada.
  if (darkLogoDataUrl) {
    const coverW = Math.min(contentW * 0.66, 126);
    const coverH = coverW * LOGO_ASPECT;
    const top = y + 2;
    const bottom = pageH - 26;
    if (bottom - top >= coverH) {
      const logoY = top + (bottom - top - coverH) / 2;
      setOpacity(doc, 1);
      try {
        doc.addImage(darkLogoDataUrl, "PNG", (pageW - coverW) / 2, logoY, coverW, coverH);
      } catch {
        // Sin logo no se dibuja.
      }
      setFont(doc, 9, MUTED, "italic");
      doc.text("Plan alimentario personalizado", pageW / 2, logoY + coverH + 8, { align: "center" });
    }
  }

  const days = data.days || [];
  if (days.length) {
    newPage();
    sectionTitle("Tu semana", GREEN);
  }
  days.forEach((day, dayIndex) => {
    const dayColor = GREEN;
    const meals = day.meals || [];
    if (dayIndex > 0) newPage();

    const pageStartY = y + 14;
    const available = pageH - 18 - pageStartY;
    let density = DENSITIES[DENSITIES.length - 1];
    for (const candidate of DENSITIES) {
      if (estimateDayHeight(meals, candidate) <= available) {
        density = candidate;
        break;
      }
    }

    doc.setFillColor(...dayColor);
    doc.roundedRect(margin, y, contentW, 11, 3, 3, "F");
    setFont(doc, 11, [255, 255, 255], "bold");
    doc.text(text(day.label) || `Día ${dayIndex + 1}`, margin + 6, y + 7.3);
    setFont(doc, 8, [240, 253, 250], "normal");
    doc.text(`${meals.length} ${meals.length === 1 ? "comida" : "comidas"}`, pageW - margin - 6, y + 7.3, { align: "right" });
    y += 14;

    meals.forEach((meal) => {
      const mealColor = GREEN;
      const rows = (meal.foods || []).map((food) => [
        text(food.name),
        quantity(food),
        text(food.equivalence),
        text(food.notes),
      ]);
      if (rows.length === 0) rows.push(["Sin alimentos", "", "", ""]);

      // Título de la comida: "Desayuno: Fajitas integrales rellenas".
      const labelText = text(meal.label) || "Comida";
      setFont(doc, 9.8, dayColor, "bold");
      doc.text(labelText, margin + 2, y);
      if (meal.title) {
        const labelW = doc.getTextWidth(labelText);
        const totalsW = meal.calories || meal.protein || meal.carbs || meal.fat ? 52 : 0;
        const availTitleW = pageW - margin - 4 - totalsW - (margin + 2 + labelW);
        if (availTitleW > 12) {
          const titleText = doc.splitTextToSize(`: ${text(meal.title)}`, availTitleW)[0] || "";
          setFont(doc, 9.2, INK, "normal");
          doc.text(titleText, margin + 2 + labelW, y);
        }
      }
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
      y += 3;

      autoTable(doc, {
        startY: y,
        margin: { left: margin + 2, right: margin + 2, top: 18, bottom: 18 },
        head: [["Alimento", "Cantidad", "Equivalencia", "Indicaciones"]],
        body: rows,
        theme: "grid",
        pageBreak: "avoid",
        rowPageBreak: "avoid",
        styles: {
          font: "helvetica",
          fontSize: density.fontSize,
          textColor: INK,
          cellPadding: density.padding,
          lineColor: [229, 231, 235],
          lineWidth: 0.2,
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: {
          fillColor: mealColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: Math.max(7, density.fontSize - 1.2),
        },
        alternateRowStyles: { fillColor: PALE_GREEN_ALT },
        columnStyles: {
          0: { cellWidth: contentW * 0.32, fontStyle: "bold" },
          1: { cellWidth: contentW * 0.16 },
          2: { cellWidth: contentW * 0.22 },
          3: { cellWidth: contentW * 0.3, textColor: MUTED },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 3;
      if (meal.notes) {
        const lines = doc.splitTextToSize(`Indicación: ${text(meal.notes)}`, contentW - 14);
        ensureSpace(lines.length * 4 + 6);
        doc.setFillColor(...PALE_GREEN);
        doc.setDrawColor(...GREEN_SOFT);
        doc.roundedRect(margin + 2, y, contentW - 4, lines.length * 4 + 5, 2, 2, "FD");
        setFont(doc, 7.8, GREEN_MEDIUM, "italic");
        doc.text(lines, margin + 6, y + 4);
        y += lines.length * 4 + 8;
      }
      y += density.lineGap;
    });
    y += 2;
  });

  const tips = text(data.tips).split("\n").map((tip) => tip.trim()).filter(Boolean);
  if (data.supplements?.length || data.recipes?.length || tips.length) {
    newPage();
  }

  if (data.supplements?.length) {
    sectionTitle("Suplementos", GREEN);
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
      styles: { font: "helvetica", fontSize: 8, textColor: INK, cellPadding: 2.5, lineColor: GREEN_SOFT, lineWidth: 0.2 },
      headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
      alternateRowStyles: { fillColor: PALE_GREEN },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 36 }, 1: { cellWidth: 25 }, 2: { cellWidth: 32 }, 3: { cellWidth: 29 }, 4: { cellWidth: contentW - 122 } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  if (data.recipes?.length) {
    sectionTitle("Recetas recomendadas", GREEN);
    data.recipes.forEach((recipe) => {
      ensureSpace(30);
      doc.setFillColor(...PALE_GREEN);
      doc.setDrawColor(...GREEN_SOFT);
      doc.roundedRect(margin, y - 4, contentW, 9, 2, 2, "FD");
      setFont(doc, 10, GREEN_MEDIUM, "bold");
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

  const totalPages = (doc as any).getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    watermark(page);
    doc.setPage(page);
    footer(page);
  }

  const filename = `Plan-${text(data.patientName).replace(/\s+/g, "-")}.pdf`;
  doc.save(filename);
}
