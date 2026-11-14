"use client";

import { Badge } from "@/components/ui/badge";

interface AnatomicalSilhouetteProps {
  adiposo: {
    superiorPct: number | null;
    centralPct: number | null;
    inferiorPct: number | null;
    predominante: string | null;
  };
  muscular: {
    brazoPct: number | null;
    musloPct: number | null;
    piernaPct: number | null;
    predominante: string | null;
  };
}

function fmtPct(v: number | null): string {
  return v == null ? "—" : `${v.toFixed(2).replace(".", ",")}%`;
}

export function AnatomicalSilhouette({ adiposo, muscular }: AnatomicalSilhouetteProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border bg-muted/10 p-3 sm:p-4">
        {/* Columna izquierda: Tejido adiposo */}
        <div className="space-y-4 text-center">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Tejido adiposo</p>
          <div>
            <p className="text-[11px] text-muted-foreground">Superior:</p>
            <p className="text-sm font-bold">{fmtPct(adiposo.superiorPct)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Central:</p>
            <p className="text-sm font-bold">{fmtPct(adiposo.centralPct)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Inferior:</p>
            <p className="text-sm font-bold">{fmtPct(adiposo.inferiorPct)}</p>
          </div>
        </div>

        {/* Silueta anatómica bicolor SVG */}
        <div className="flex justify-center">
          <svg
            viewBox="0 0 120 260"
            className="h-52 w-24 sm:h-60 sm:w-28"
            role="img"
            aria-label="Distribución anatómica de tejido adiposo y muscular"
          >
            <defs>
              <clipPath id="leftHalf">
                <rect x="0" y="0" width="60" height="260" />
              </clipPath>
              <clipPath id="rightHalf">
                <rect x="60" y="0" width="60" height="260" />
              </clipPath>
              <g id="bodyShape">
                {/* Cabeza y cuello */}
                <circle cx="60" cy="22" r="14" />
                <rect x="53" y="34" width="14" height="10" rx="3" />
                {/* Torso y hombros */}
                <path d="M36 48 C36 43 44 42 60 42 C76 42 84 43 84 48 L80 118 C79 125 74 132 60 132 C46 132 41 125 40 118 Z" />
                {/* Brazo izquierdo */}
                <path d="M36 48 L22 92 L18 130 C17 134 23 135 25 131 L32 95 L41 64 Z" />
                {/* Brazo derecho */}
                <path d="M84 48 L98 92 L102 130 C103 134 97 135 95 131 L88 95 L79 64 Z" />
                {/* Pierna izquierda */}
                <path d="M41 124 L39 182 L42 242 C42 247 50 247 51 242 L54 182 L58 132 Z" />
                {/* Pierna derecha */}
                <path d="M79 124 L81 182 L78 242 C78 247 70 247 69 242 L66 182 L62 132 Z" />
              </g>
            </defs>

            {/* Mitad izquierda: Tejido adiposo (ámbar/dorado) */}
            <use href="#bodyShape" clipPath="url(#leftHalf)" fill="#eab308" fillOpacity="0.82" />
            {/* Mitad derecha: Tejido muscular (rojo/coral) */}
            <use href="#bodyShape" clipPath="url(#rightHalf)" fill="#dc2626" fillOpacity="0.82" />
            {/* Línea divisoria central sutil */}
            <line x1="60" y1="8" x2="60" y2="246" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
          </svg>
        </div>

        {/* Columna derecha: Tejido muscular */}
        <div className="space-y-4 text-center">
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">Tejido muscular</p>
          <div>
            <p className="text-[11px] text-muted-foreground">Brazo:</p>
            <p className="text-sm font-bold">{fmtPct(muscular.brazoPct)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Muslo:</p>
            <p className="text-sm font-bold">{fmtPct(muscular.musloPct)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Pierna:</p>
            <p className="text-sm font-bold">{fmtPct(muscular.piernaPct)}</p>
          </div>
        </div>
      </div>

      {/* Indicadores de zonas predominantes */}
      <div className="flex flex-wrap gap-2 justify-center">
        {adiposo.predominante && (
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 text-xs">
            Mayor adiposidad: Zona {adiposo.predominante}
          </Badge>
        )}
        {muscular.predominante && (
          <Badge variant="outline" className="border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 text-xs">
            Mayor masa muscular: {muscular.predominante}
          </Badge>
        )}
      </div>
    </div>
  );
}
