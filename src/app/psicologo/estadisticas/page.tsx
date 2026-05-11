import { obtenerRiesgoSemanal } from '@/lib/analiticas/riesgo-semanal';
import { obtenerTendenciasEmocionales } from '@/lib/analiticas/tendencias-emocionales';
import { obtenerResumenPsicologico } from '@/lib/analiticas/dashboard-psicologico';
import { obtenerIndicadoresConductuales } from '@/lib/analiticas/ranking-secciones';
import { obtenerRiesgoPredictivo } from '@/lib/analiticas/riesgo-predictivo';

import { RankingSecciones } from './RankingSecciones';
import { GraficosRiesgoSemanal } from './GraficosRiesgoSemanal';
import { TendenciaEmocional } from './TendenciaEmocional';
import { MapaCalor } from './MapaCalor';
import { DistribucionRiesgo } from './DistribucionRiesgo';
import { IndicadoresConductuales } from './IndicadoresConductuales';
import { PrediccionRiesgo } from './PrediccionRiesgo';

export default async function EstadisticasPage() {
  const [estadisticas, tendencias, resumen, indicadores, prediccion] = await Promise.all([
    obtenerRiesgoSemanal(),
    obtenerTendenciasEmocionales(),
    obtenerResumenPsicologico(),
    obtenerIndicadoresConductuales(),
    obtenerRiesgoPredictivo(),
  ]);

  const bajo = estadisticas.reduce((acc, item) => acc + item.riesgoBajo, 0);
  const medio = estadisticas.reduce((acc, item) => acc + item.riesgoMedio, 0);
  const alto = estadisticas.reduce((acc, item) => acc + item.riesgoAlto, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Analítica psicológica
        </h1>

        <p className="text-slate-500">
          KPIs, heatmaps, tendencias, scoring de riesgo e indicadores predictivos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CardResumen
          titulo="Cobertura"
          valor={`${resumen.cobertura}%`}
          descripcion={`${resumen.respuestasSemana} respuestas / ${resumen.totalEstudiantes} estudiantes`}
        />

        <CardResumen
          titulo="Tasa de riesgo"
          valor={`${resumen.tasaRiesgo}%`}
          descripcion={`${resumen.respuestasRiesgo} respuestas MID/HIGH esta semana`}
          warning={resumen.tasaRiesgo >= 20}
        />

        <CardResumen
          titulo="Alertas pendientes"
          valor={resumen.alertasPendientes}
          descripcion="requieren revisión"
          danger
        />

        <CardResumen
          titulo="Score promedio"
          valor={resumen.promedioScore}
          descripcion={`${resumen.riesgoAlto} riesgo alto · ${resumen.quierenHablar} quieren hablar`}
          danger={resumen.promedioScore >= 70}
          warning={resumen.promedioScore >= 40}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DistribucionRiesgo
          bajo={bajo}
          medio={medio}
          alto={alto}
        />

        <TendenciaEmocional data={tendencias} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <IndicadoresConductuales data={indicadores} />
        <PrediccionRiesgo data={prediccion} />
      </div>

      <GraficosRiesgoSemanal data={estadisticas} />

      <MapaCalor data={estadisticas} />

      <RankingSecciones data={estadisticas} />
    </div>
  );
}

function CardResumen({
  titulo,
  valor,
  descripcion,
  danger = false,
  warning = false,
}: {
  titulo: string;
  valor: number | string;
  descripcion: string;
  danger?: boolean;
  warning?: boolean;
}) {
  const valueColor = danger ? 'text-red-600' : warning ? 'text-yellow-600' : 'text-slate-900';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {titulo}
      </p>

      <p className={`mt-2 text-3xl font-bold ${valueColor}`}>
        {valor}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {descripcion}
      </p>
    </div>
  );
}
