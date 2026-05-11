import { BrainCircuit, TrendingDown, TrendingUp } from 'lucide-react';
import type { RiesgoPredictivo } from '@/lib/analiticas/riesgo-predictivo';

export function PrediccionRiesgo({ data }: { data: RiesgoPredictivo }) {
  const isUp = data.variacionScore > 0 || data.variacionRiesgo > 0;
  const tone =
    data.nivelProyectado === 'HIGH'
      ? 'border-red-200 bg-red-50 text-red-700'
      : data.nivelProyectado === 'MID'
      ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Predictive analytics</h2>
          <p className="text-sm text-slate-500">
            Proyección heurística para la próxima semana, basada en las últimas dos ventanas de 7 días.
          </p>
        </div>
        <BrainCircuit className="h-6 w-6 text-brand-600" />
      </div>

      <div className={`rounded-lg border p-4 ${tone}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Score proyectado</p>
            <p className="mt-1 text-4xl font-bold">{data.prediccionProximaSemana}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Confianza</p>
            <p className="mt-1 text-2xl font-bold">{data.confianza}%</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Metric
          label="Variación de riesgo"
          value={`${data.variacionRiesgo > 0 ? '+' : ''}${data.variacionRiesgo}%`}
          rising={data.variacionRiesgo > 0}
        />
        <Metric
          label="Variación de score"
          value={`${data.variacionScore > 0 ? '+' : ''}${data.variacionScore}`}
          rising={data.variacionScore > 0}
        />
      </div>

      <div className="mt-4 space-y-2">
        {data.factores.map((factor) => (
          <div key={factor} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {factor}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        {isUp ? <TrendingUp className="h-4 w-4 text-red-500" /> : <TrendingDown className="h-4 w-4 text-emerald-600" />}
        Comparación contra la semana anterior.
      </div>
    </div>
  );
}

function Metric({ label, value, rising }: { label: string; value: string; rising: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={rising ? 'mt-1 text-lg font-bold text-red-600' : 'mt-1 text-lg font-bold text-emerald-600'}>
        {value}
      </p>
    </div>
  );
}
