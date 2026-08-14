import { ExternalLink, FileImage, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Loan = any;

export function LoanList({ loans }: { loans: Loan[] }) {
    if (loans.length === 0) return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Todavía no hay préstamos registrados.</CardContent></Card>;

    return <>
        <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
                <TableHeader><TableRow><TableHead>Registro</TableHead><TableHead>Responsable</TableHead><TableHead>Destino</TableHead><TableHead>Depósito</TableHead><TableHead>Materiales</TableHead><TableHead>Fecha</TableHead><TableHead>Comprobante</TableHead></TableRow></TableHeader>
                <TableBody>{loans.map((loan) => <TableRow key={loan.id}>
                    <TableCell className="font-semibold">{loan.number}</TableCell>
                    <TableCell><div>{loan.responsibleName}</div><div className="text-xs text-muted-foreground">DNI {loan.responsibleDni}</div></TableCell>
                    <TableCell>{loan.destination}</TableCell>
                    <TableCell>{loan.warehouse.name}</TableCell>
                    <TableCell>{loan.items.length} producto{loan.items.length === 1 ? "" : "s"}</TableCell>
                    <TableCell>{new Date(loan.createdAt).toLocaleDateString("es-AR")}</TableCell>
                    <TableCell><a href={loan.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline"><FileImage className="h-4 w-4" /> Ver foto</a></TableCell>
                </TableRow>)}</TableBody>
            </Table>
        </div>
        <div className="grid gap-3 md:hidden">{loans.map((loan) => <Card key={loan.id}><CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{loan.number}</p><p className="text-xs text-muted-foreground">{new Date(loan.createdAt).toLocaleDateString("es-AR")}</p></div><Badge variant="outline">Egreso</Badge></div>
            <div className="grid gap-1 text-sm"><p className="flex items-center gap-2"><UserRound className="h-4 w-4 text-muted-foreground" />{loan.responsibleName} · DNI {loan.responsibleDni}</p><p className="text-muted-foreground">Destino: {loan.destination}</p><p className="text-muted-foreground">Depósito: {loan.warehouse.name}</p><p className="text-muted-foreground">{loan.items.length} producto{loan.items.length === 1 ? "" : "s"}</p></div>
            <a href={loan.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline"><FileImage className="h-4 w-4" /> Ver comprobante <ExternalLink className="h-3.5 w-3.5" /></a>
        </CardContent></Card>)}</div>
    </>;
}
