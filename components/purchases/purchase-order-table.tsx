"use client";

import { useDeferredValue, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const statusLabels: Record<string, string> = { RECEIVED: "Recibida completa", PARTIALLY_RECEIVED: "Recibida parcial", DRAFT: "Pendiente de recepción", CANCELLED: "Cancelada" };
const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = { RECEIVED: "default", PARTIALLY_RECEIVED: "outline", DRAFT: "secondary", CANCELLED: "destructive" };

function searchableText(order: any) {
    return [order.orderNumber, order.supplier?.name, order.warehouse?.name, order.status, order.subject, order.causative, order.responsible, order.expediente?.number, order.expediente?.year, order.expediente?.description].filter(Boolean).join(" ").toLowerCase();
}

export function PurchaseOrderTable({ orders }: { orders: any[] }) {
    const [search, setSearch] = useState("");
    const deferredSearch = useDeferredValue(search.trim().toLowerCase());
    const filteredOrders = deferredSearch ? orders.filter(order => searchableText(order).includes(deferredSearch)) : orders;

    return <div className="space-y-4">
        <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por orden, expediente, proveedor, asunto, causante o responsable..." className="pl-9" />
        </div>
        {filteredOrders.length === 0 ? <Card><CardContent className="py-12 text-center"><ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><h3 className="text-lg font-semibold">No se encontraron órdenes</h3></CardContent></Card> : <>
            <div className="block space-y-4 md:hidden">{filteredOrders.map(order => <Card key={order.id}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><Link href={`/dashboard/purchases/${order.id}`} className="font-mono text-lg font-medium hover:underline">{order.orderNumber}</Link><div className="text-sm text-muted-foreground">{order.supplier.name}</div><div className="text-sm text-muted-foreground">Expediente: {order.expediente ? `${order.expediente.number}${order.expediente.year ? ` (${order.expediente.year})` : ""}` : "-"}</div></div><Badge variant={statusColors[order.status]}>{statusLabels[order.status] || order.status}</Badge></div><div className="mt-3 flex items-center justify-between text-sm"><Badge variant="secondary">{order._count.items} artículos</Badge><span className="font-medium">${Number(order.totalAmount).toFixed(2)}</span></div><div className="mt-2 text-xs text-muted-foreground">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: es })}</div><Button variant="outline" size="sm" asChild className="mt-3 w-full"><Link href={`/dashboard/purchases/${order.id}`}><Eye className="mr-1 h-4 w-4" />Ver</Link></Button></CardContent></Card>)}</div>
            <div className="hidden overflow-x-auto rounded-md border md:block"><Table><TableHeader><TableRow><TableHead>Número de Orden</TableHead><TableHead>Expediente</TableHead><TableHead>Proveedor</TableHead><TableHead>Almacén</TableHead><TableHead>Artículos</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead>Creado</TableHead><TableHead /></TableRow></TableHeader><TableBody>{filteredOrders.map(order => <TableRow key={order.id}><TableCell className="font-mono font-medium"><Link href={`/dashboard/purchases/${order.id}`} className="hover:underline">{order.orderNumber}</Link></TableCell><TableCell><Link href={order.expediente ? `/dashboard/expedientes/${order.expediente.id}` : "#"} className="hover:underline">{order.expediente ? <><div>{order.expediente.number}{order.expediente.year ? ` (${order.expediente.year})` : ""}</div><div className="text-xs text-muted-foreground">{order.expediente.description || ""}</div></> : "-"}</Link></TableCell><TableCell>{order.supplier.name}</TableCell><TableCell className="text-sm text-muted-foreground">{order.warehouse.name}</TableCell><TableCell><Badge variant="secondary">{order._count.items}</Badge></TableCell><TableCell className="font-medium">${Number(order.totalAmount).toFixed(2)}</TableCell><TableCell><Badge variant={statusColors[order.status]}>{statusLabels[order.status] || order.status}</Badge></TableCell><TableCell className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: es })}</TableCell><TableCell><Button variant="ghost" size="icon" asChild><Link href={`/dashboard/purchases/${order.id}`}><Eye className="h-4 w-4" /></Link></Button></TableCell></TableRow>)}</TableBody></Table></div>
        </>}
    </div>;
}
