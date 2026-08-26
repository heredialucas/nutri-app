"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface CashSummaryProps {
    totalIncome: number;
    totalExpenses: number;
    periodLabel?: string;
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
    }).format(amount);
}

export function CashSummary({ totalIncome, totalExpenses, periodLabel = "Este mes" }: CashSummaryProps) {
    const profit = totalIncome - totalExpenses;

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                            <p className="text-xs text-muted-foreground">Ingresos — {periodLabel}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                            <p className="text-xs text-muted-foreground">Gastos — {periodLabel}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatCurrency(profit)}
                            </p>
                            <p className="text-xs text-muted-foreground">Balance — {periodLabel}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
