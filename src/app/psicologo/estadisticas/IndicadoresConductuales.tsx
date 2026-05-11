import { Activity, AlertTriangle, Repeat2, Siren } from 'lucide-react';
import type { IndicadorConductual } from '@/lib/analiticas/ranking-secciones';

const icons = [Activity, Siren, Repeat2, AlertTriangle];

export function IndicadoresConductuales({ data }: { data: IndicadorConductual[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Behavioral indicators</h2>
        <p className="text-sm text-slate-500">
          Señales agregadas de conducta emocional y recurrencia de riesgo.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {data.map((item, index) => {
          const Icon = icons[index] || Activity;
          const tone =
            item.severidad === 'HIGH'
              ? 'border-red-200 bg-red-50 text-red-700'
              : item.severidad === 'MID'
              ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700';

          return (
            <div key={item.indicador} className={`rounded-lg border p-4 ${tone}`}>
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{item.indicador}</p>
                  <p className="mt-1 text-2xl font-bold">{item.valor}</p>
                  <p className="mt-1 text-xs opacity-80">{item.descripcion}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
