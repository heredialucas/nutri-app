"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generatePlanPdf, type PlanPdfInput } from "@/lib/plan-pdf";

export function PlanExportButton({
  data,
  label = "Descargar PDF",
  variant = "outline",
  size = "sm",
  className,
}: {
  data: PlanPdfInput;
  label?: string;
  variant?: "outline" | "default" | "ghost" | "secondary";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
}) {
  const handleExport = () => {
    try {
      generatePlanPdf(data);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo generar el PDF del plan");
    }
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleExport}>
      <FileDown className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}
