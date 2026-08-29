"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

function toParam(year: number, month: number) {
    const m = String(month + 1).padStart(2, "0");
    return `${year}-${m}`;
}

export function MonthNav({ year, month }: { year: number; month: number }) {
    const router = useRouter();
    const pathname = usePathname();

    const goTo = (y: number, m: number) => {
        router.push(`${pathname}?month=${toParam(y, m)}`);
    };

    const prev = month === 0 ? [year - 1, 11] : [year, month - 1];
    const next = month === 11 ? [year + 1, 0] : [year, month + 1];
    const isCurrent =
        month === new Date().getMonth() && year === new Date().getFullYear();

    const monthLabel = new Intl.DateTimeFormat("es-AR", {
        month: "long",
        year: "numeric",
    }).format(new Date(year, month, 1));

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => goTo(prev[0], prev[1])}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold capitalize min-w-[180px] text-center">{monthLabel}</h2>
            <Button variant="outline" size="icon" onClick={() => goTo(next[0], next[1])}>
                <ChevronRight className="h-4 w-4" />
            </Button>
            {!isCurrent && (
                <Button variant="ghost" size="sm" onClick={() => {
                    const now = new Date();
                    goTo(now.getFullYear(), now.getMonth());
                }}>
                    Hoy
                </Button>
            )}
        </div>
    );
}
