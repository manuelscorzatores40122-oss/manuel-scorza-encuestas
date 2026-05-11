
// src/app/psicologo/estadisticas/RankingSecciones.tsx

import type { RiesgoSemanalItem } from '@/lib/analiticas/riesgo-semanal';

export function RankingSecciones({
  data,
}: {
  data: RiesgoSemanalItem[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Risk scoring por sección
        </h2>

        <p className="text-sm text-slate-500">
          Priorización por score promedio, riesgo alto y estudiantes que quieren hablar.
        </p>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={`${item.grado}-${item.seccion}-${index}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
          >
            <div>
              <p className="font-semibold text-slate-900">
                {item.grado} - {item.seccion}
              </p>

              <p className="text-sm text-slate-500">
                {item.totalRespuestas} respuestas · {item.riesgoAlto} alto · {item.quierenHablar} quieren hablar
              </p>
            </div>

            <div className="text-right">
              <p
                className={`text-xl font-bold ${
                  item.indiceCriticidad >= 80
                    ? 'text-red-600'
                    : item.indiceCriticidad >= 45
                    ? 'text-yellow-600'
                    : 'text-emerald-600'
                }`}
              >
                {item.indiceCriticidad}
              </p>

              <p className="text-xs text-slate-500">
                índice de criticidad
              </p>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-slate-400">
            No hay secciones con respuestas recientes.
          </div>
        )}
      </div>
    </div>
  );
}
