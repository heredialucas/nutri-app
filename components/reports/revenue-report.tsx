"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

interface RevenueReportProps {
    data: { month: string; income: number; expenses: number }[];
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatMonth(monthStr: string) {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("es-AR", { month: "short" });
}

export function RevenueReport({ data }: RevenueReportProps) {
    const chartData = data.map((d) => ({
        ...d,
        label: formatMonth(d.month),
        profit: d.income - d.expenses,
    }));

    const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
    const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Ingresos vs Gastos
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                    <div>
                        <p className="text-muted-foreground">Total ingresos</p>
                        <p className="font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Total gastos</p>
                        <p className="font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Balance</p>
                        <p className={`font-bold ${totalIncome - totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(totalIncome - totalExpenses)}
                        </p>
                    </div>
                </div>

                {data.length > 0 ? (
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" fontSize={12} />
                                <YAxis fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                <Legend />
                                <Bar dataKey="income" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expenses" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">Sin datos para mostrar</p>
                )}
            </CardContent>
        </Card>
    );
}
