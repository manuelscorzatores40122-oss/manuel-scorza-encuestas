// src/app/psicologo/estadisticas/MapaCalor.tsx

'use client';

export function MapaCalor({
  data,
}: {
  data: any[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Mapa de calor psicológico
        </h2>

        <p className="text-sm text-slate-500">
          Identificación rápida de secciones críticas
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.map((item, index) => {
          const color =
            item.promedioRiesgo >= 70
              ? 'bg-red-100 border-red-300 text-red-700'
              : item.promedioRiesgo >= 40
              ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
              : 'bg-green-100 border-green-300 text-green-700';

          return (
            <div
              key={index}
              className={`rounded-xl border p-4 ${color}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">
                    {item.grado} - {item.seccion}
                  </p>

                  <p className="text-sm opacity-80">
                    {item.totalRespuestas} respuestas
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {item.promedioRiesgo}
                  </p>

                  <p className="text-xs">
                    riesgo
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
