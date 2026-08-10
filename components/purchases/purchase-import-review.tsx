"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Check, ChevronDown, ChevronRight, FileSpreadsheet, Loader2, Pencil, Search, Trash2 } from "lucide-react";
import { ImportedWorkbookLine, normalizeImportedValue } from "@/services/purchase-workbook-parser";

interface ImportReviewProps {
    lines: ImportedWorkbookLine[];
    products: any[];
    fileName: string;
    isPending?: boolean;
    onChange: (lines: ImportedWorkbookLine[]) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export function PurchaseImportReview({
    lines,
    products,
    fileName,
    isPending = false,
    onChange,
    onConfirm,
    onCancel,
}: ImportReviewProps) {
    const [search, setSearch] = useState("");
    const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
    const [editingSupplier, setEditingSupplier] = useState<string | null>(null);

    const groups = useMemo(() => {
        const grouped = new Map<string, ImportedWorkbookLine[]>();
        for (const line of lines) {
            const key = line.supplierName.trim() || "Proveedor sin nombre";
            grouped.set(key, [...(grouped.get(key) || []), line]);
        }
        return [...grouped.entries()];
    }, [lines]);

    const visibleGroups = useMemo(() => {
        const query = normalizeImportedValue(search);
        if (!query) return groups;

        return groups
            .map(([supplierName, supplierLines]) => {
                const supplierMatches = normalizeImportedValue(supplierName).includes(query);
                const visibleLines = supplierMatches
                    ? supplierLines
                    : supplierLines.filter(line => normalizeImportedValue(line.productName).includes(query));
                return [supplierName, visibleLines] as [string, ImportedWorkbookLine[]];
            })
            .filter(([, supplierLines]) => supplierLines.length > 0);
    }, [groups, search]);

    const unresolvedProducts = lines.filter(line => !line.productId).length;
    const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

    const updateLine = (id: string, update: Partial<ImportedWorkbookLine>) => {
        onChange(lines.map(line => line.id === id ? { ...line, ...update } : line));
    };

    const removeLine = (id: string) => onChange(lines.filter(line => line.id !== id));

    const toggleSupplier = (supplierName: string) => {
        setExpandedSuppliers(previous => {
            const next = new Set(previous);
            if (next.has(supplierName)) next.delete(supplierName);
            else next.add(supplierName);
            return next;
        });
    };

    return (
        <div className="space-y-5">
            <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                            <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-semibold">{fileName}</p>
                            <p className="text-xs text-muted-foreground">Lectura agrupada desde la columna ADJ.</p>
                        </div>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Total importado</p>
                        <p className="text-xl font-black text-primary">${total.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {unresolvedProducts > 0 && (
                <div className="flex gap-3 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{unresolvedProducts} producto(s) no coinciden con el catálogo. Se crearán automáticamente al confirmar, salvo que los vincules manualmente.</p>
                </div>
            )}

            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar proveedor o producto..." className="h-11 pl-9" />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{visibleGroups.length} de {groups.length} proveedores</span>
                {search && <button type="button" className="font-medium text-primary hover:underline" onClick={() => setSearch("")}>Limpiar búsqueda</button>}
            </div>

            {visibleGroups.map(([supplierName, supplierLines]) => {
                const allSupplierLines = groups.find(([name]) => name === supplierName)?.[1] || supplierLines;
                const isExpanded = expandedSuppliers.has(supplierName) || Boolean(search);
                const supplierTotal = allSupplierLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

                return (
                    <Card key={supplierName} className="overflow-hidden border-primary/10 shadow-sm">
                        <CardHeader className="p-0">
                            <button type="button" onClick={() => toggleSupplier(supplierName)} className="flex min-w-0 w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-3 text-left transition-colors hover:bg-muted/40 sm:px-4">
                                {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-primary" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                <span className="min-w-0 flex-1 truncate font-semibold">{supplierName}</span>
                                <span className="ml-7 text-xs text-muted-foreground sm:ml-0">{allSupplierLines.length} artículos</span>
                                <span className="ml-auto font-bold text-primary">${supplierTotal.toFixed(2)}</span>
                            </button>
                        </CardHeader>
                        {isExpanded && <CardContent className="space-y-3 border-t bg-muted/[0.08] p-3 sm:p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Detalle de la orden</Label>
                                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditingSupplier(editingSupplier === supplierName ? null : supplierName)}>
                                        <Pencil className="mr-1 h-3 w-3" /> Editar proveedor
                                    </Button>
                                </div>
                                {search && supplierLines.length !== allSupplierLines.length && <span className="text-xs text-muted-foreground">{supplierLines.length} coincidencias</span>}
                            </div>
                            {editingSupplier === supplierName && (
                                <Input
                                    autoFocus
                                    value={supplierName}
                                    onChange={event => {
                                        const value = event.target.value;
                                        onChange(lines.map(line => line.supplierName === supplierName ? { ...line, supplierName: value } : line));
                                        setEditingSupplier(value);
                                    }}
                                    className="h-9 bg-background font-semibold"
                                />
                            )}
                            {supplierLines.map(line => (
                                <div key={line.id} className="grid min-w-0 gap-3 rounded-lg border bg-background p-3 sm:p-4 md:grid-cols-[minmax(0,1fr)_110px_140px_34px] md:items-end">
                                    <div className="min-w-0 space-y-1 md:col-span-4">
                                        <Label className="text-xs text-muted-foreground">Producto · ítem {line.itemNumber}</Label>
                                        <Select
                                            value={line.productId || `new:${line.id}`}
                                            onValueChange={value => {
                                                if (value.startsWith("new:")) {
                                                    updateLine(line.id, { productId: undefined });
                                                    return;
                                                }
                                                const product = products.find(item => item.id === value);
                                                updateLine(line.id, { productId: value, productName: product?.name || line.productName });
                                            }}
                                        >
                                            <SelectTrigger className="h-auto min-h-10 w-full min-w-0 max-w-full bg-background py-2 text-left [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:whitespace-normal [&_[data-slot=select-value]]:text-wrap [&_[data-slot=select-value]]:line-clamp-none">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-3rem)]">
                                                <SelectItem value={`new:${line.id}`} className="min-w-0 max-w-full">
                                                    <span className="block min-w-0 whitespace-normal break-words" title={line.productName}>{line.productName}</span>
                                                </SelectItem>
                                                {products.map(product => (
                                                    <SelectItem key={product.id} value={product.id} className="min-w-0 max-w-full">
                                                        <span className="block min-w-0 whitespace-normal break-words" title={product.name}>
                                                            {product.name}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {!line.productId && <p className="text-[11px] text-amber-700">Se creará automáticamente si confirmás.</p>}
                                    </div>
                                    <div className="space-y-1 md:col-start-2">
                                        <Label className="text-xs text-muted-foreground">Cantidad</Label>
                                        <Input type="number" min="1" value={line.quantity} onChange={event => updateLine(line.id, { quantity: Number(event.target.value) || 0 })} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Precio unitario</Label>
                                        <Input type="number" min="0" step="0.01" value={line.unitPrice} onChange={event => updateLine(line.id, { unitPrice: Number(event.target.value) || 0 })} />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(line.id)} className="justify-self-end text-destructive hover:bg-destructive/10 md:justify-self-auto">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>}
                    </Card>
                );
            })}

            {visibleGroups.length === 0 && (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No se encontraron proveedores ni productos para “{search}”.
                </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>Elegir otro archivo</Button>
                <Button type="button" onClick={onConfirm} disabled={isPending || lines.length === 0 || lines.some(line => !line.supplierName.trim() || line.quantity <= 0 || line.unitPrice < 0)}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Confirmar y crear {groups.length} orden{groups.length === 1 ? "" : "es"}
                </Button>
            </div>
        </div>
    );
}
