
// src/app/psicologo/estadisticas/MapaCalor.tsx

'use client';

import type { RiesgoSemanalItem } from '@/lib/analiticas/riesgo-semanal';

export function MapaCalor({
  data,
}: {
  data: RiesgoSemanalItem[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Heatmap psicológico
        </h2>

        <p className="text-sm text-slate-500">
          Identificación rápida de secciones críticas por score, riesgo alto y solicitudes de apoyo.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.map((item, index) => {
          const color =
            item.indiceCriticidad >= 80
              ? 'bg-red-100 border-red-300 text-red-700'
              : item.indiceCriticidad >= 45
              ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
              : 'bg-emerald-100 border-emerald-300 text-emerald-700';

          return (
            <div
              key={`${item.grado}-${item.seccion}-${index}`}
              className={`rounded-lg border p-4 ${color}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">
                    {item.grado} - {item.seccion}
                  </p>

                  <p className="text-sm opacity-80">
                    {item.totalRespuestas} respuestas · {item.tasaRiesgo}% riesgo
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {item.indiceCriticidad}
                  </p>

                  <p className="text-xs">
                    criticidad
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {data.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-slate-400">
          No hay datos recientes para construir el mapa de calor.
        </div>
      )}
    </div>
  );
}
