"use client";

import { useState } from "react";
import { IsakVisuals } from "./isak-visuals";
import { IsakPdfButton } from "./isak-pdf";
import type { IsakResult } from "@/lib/isak/calculations";

interface PatientIsakViewProps {
  currentResult: IsakResult;
  currentDate: string;
  fechaTexto: string;
  paciente: string;
  evaluador: string;
  evolutionData: { date: string; result: IsakResult }[];
}

export function PatientIsakView({
  currentResult,
  currentDate,
  fechaTexto,
  paciente,
  evaluador,
  evolutionData,
}: PatientIsakViewProps) {
  const [compareDate, setCompareDate] = useState<string | undefined>(undefined);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <IsakPdfButton
          result={currentResult}
          paciente={paciente}
          fecha={fechaTexto}
          evaluador={evaluador}
          currentDate={currentDate}
          compareWithDate={compareDate}
          evolutionData={evolutionData}
        />
      </div>
      <IsakVisuals
        data={evolutionData}
        currentDate={currentDate}
        compareWithDate={compareDate}
        onCompareDateChange={setCompareDate}
      />
    </div>
  );
}
