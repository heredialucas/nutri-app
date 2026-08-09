export interface ImportedWorkbookLine {
    id: string;
    itemNumber: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    supplierName: string;
    productId?: string;
}

export interface ParsedPurchaseWorkbook {
    lines: ImportedWorkbookLine[];
    supplierNames: string[];
    headerRow: number;
}

function normalize(value: unknown) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, " ")
        .trim();
}

function numberValue(value: unknown) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const parsed = Number(String(value ?? "").replace(/\./g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
}

function columnName(index: number) {
    let name = "";
    let current = index + 1;
    while (current > 0) {
        const remainder = (current - 1) % 26;
        name = String.fromCharCode(65 + remainder) + name;
        current = Math.floor((current - 1) / 26);
    }
    return name;
}

export async function parsePurchaseWorkbook(file: File): Promise<ParsedPurchaseWorkbook> {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellFormula: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new Error("El archivo no contiene hojas de cálculo");

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: "",
        raw: true,
    });

    const adjPosition = rows.findIndex(row => row.some(cell => normalize(cell) === "ADJ"));
    if (adjPosition < 0) {
        throw new Error("No se encontró el encabezado ADJ. en el archivo");
    }

    const header = rows[adjPosition] ?? [];
    const adjColumn = header.findIndex(cell => normalize(cell) === "ADJ");
    const supplierColumns = header
        .map((cell, index) => ({ name: String(cell ?? "").trim(), index }))
        .filter(({ name, index }) => index > adjColumn && name.length > 0);

    if (supplierColumns.length === 0) {
        throw new Error("No se encontraron proveedores después de la columna ADJ.");
    }

    const materialColumn = header.findIndex(cell => {
        const value = normalize(cell);
        return value === "MATERIAL" || value === "PRODUCTO" || value === "DESCRIPCION";
    });
    const quantityColumn = header.findIndex(cell => {
        const value = normalize(cell);
        return value === "CANT" || value === "CANTIDAD";
    });
    const itemColumn = header.findIndex(cell => normalize(cell).startsWith("ITEM"));

    if (materialColumn < 0 || quantityColumn < 0) {
        throw new Error("No se encontraron los encabezados de producto y cantidad");
    }

    const lines: ImportedWorkbookLine[] = [];
    for (let rowIndex = adjPosition + 1; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex] ?? [];
        const productName = String(row[materialColumn] ?? "").trim();
        const quantity = numberValue(row[quantityColumn]);
        const itemNumber = String(itemColumn >= 0 ? row[itemColumn] ?? rowIndex : rowIndex).trim();

        if (!productName || normalize(productName) === "TOTAL" || quantity <= 0) continue;

        for (const supplierColumn of supplierColumns) {
            const adjudicatedTotal = numberValue(row[supplierColumn.index]);
            if (adjudicatedTotal <= 0) continue;

            lines.push({
                id: `${rowIndex}-${supplierColumn.index}`,
                itemNumber,
                productName,
                quantity,
                unitPrice: Number((adjudicatedTotal / quantity).toFixed(2)),
                supplierName: supplierColumn.name,
            });
        }
    }

    if (lines.length === 0) {
        throw new Error("No se encontraron productos adjudicados después de ADJ.");
    }

    return {
        lines,
        supplierNames: [...new Set(lines.map(line => line.supplierName))],
        headerRow: adjPosition + 1,
    };
}

export function normalizeImportedValue(value: string) {
    return normalize(value);
}

export function createImportedProductSku(name: string) {
    const normalized = normalize(name).replace(/\s+/g, "-").slice(0, 46);
    return `IMP-${normalized || "PRODUCTO"}`;
}
