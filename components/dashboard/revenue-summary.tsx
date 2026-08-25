import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
    }).format(amount);
}

interface RevenueSummaryProps {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyProfit: number;
}

export function RevenueSummary({ monthlyIncome, monthlyExpenses, monthlyProfit }: RevenueSummaryProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="h-5 w-5 text-primary" aria-hidden="true" />
                    Resumen del mes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm text-muted-foreground">Ingresos</span>
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(monthlyIncome)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-muted-foreground">Gastos</span>
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(monthlyExpenses)}</span>
                    </div>
                    <div className="border-t pt-3 flex items-center justify-between">
                        <span className="text-sm font-medium">Ganancia neta</span>
                        <span className={`text-sm font-bold ${monthlyProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {formatCurrency(monthlyProfit)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
