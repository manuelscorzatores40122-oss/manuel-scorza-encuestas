import { obtenerResumenPsicologico } from '@/lib/analiticas/dashboard-psicologico';
import { obtenerTendenciasEmocionales, TendenciaEmocionalItem } from '@/lib/analiticas/tendencias-emocionales';
import { obtenerRiesgoSemanal } from '@/lib/analiticas/riesgo-semanal';
import { obtenerIndicadoresConductuales } from '@/lib/analiticas/ranking-secciones';
import { obtenerRiesgoPredictivo } from '@/lib/analiticas/riesgo-predictivo';
import { DatabaseUnavailable } from '@/components/BaseDatosNoDisponible';
import styles from './estadisticas.module.css';

export default async function EstadisticasPage() {
  try {
    return await renderPage();
  } catch {
    return <DatabaseUnavailable />;
  }
}

async function renderPage() {
  const [resumen, tendencias, semanal, indicadores, prediccion] = await Promise.all([
    obtenerResumenPsicologico(),
    obtenerTendenciasEmocionales(),
    obtenerRiesgoSemanal(),
    obtenerIndicadoresConductuales(),
    obtenerRiesgoPredictivo(),
  ]);

  // Distribución de riesgo
  const bajo        = semanal.reduce((s, r) => s + r.riesgoBajo,  0);
  const medio       = semanal.reduce((s, r) => s + r.riesgoMedio, 0);
  const alto        = semanal.reduce((s, r) => s + r.riesgoAlto,  0);
  const totalRiesgo = bajo + medio + alto;
  const pBajo  = totalRiesgo ? Math.round((bajo  / totalRiesgo) * 100) : 0;
  const pMedio = totalRiesgo ? Math.round((medio / totalRiesgo) * 100) : 0;
  const pAlto  = totalRiesgo ? Math.round((alto  / totalRiesgo) * 100) : 0;

  // Gráfico de línea: últimos 7 días
  const ultimos7   = tendencias.slice(-7);
  const linePoints = calcLinePoints(ultimos7);
  const fillPoints = linePoints ? `${linePoints} 320,160 0,160` : '';

  // Proyección
  const tasaActual     = prediccion.actual.total
    ? Math.round((prediccion.actual.riesgo / prediccion.actual.total) * 1000) / 10
    : 0;
  const riesgoEstimado = Math.max(0, Math.round((tasaActual + prediccion.variacionRiesgo) * 10) / 10);

  const ind0 = indicadores[0];
  const ind1 = indicadores[1];

  return (
    <div className={styles.page}>

      {/* ── Encabezado ── */}
      <header className={styles.header}>
        <div className={styles.kick}>Analítica</div>
        <h1 className={styles.pageTitle}>Analítica psicológica</h1>
        <p className={styles.pageSub}>
          Indicadores, distribución de riesgo, tendencias y proyección predictiva del bienestar estudiantil.
        </p>
      </header>

      <div className={styles.body}>

        {/* ── KPIs ── */}
        <div className={styles.glabel}>Indicadores clave · esta semana</div>
        <div className={styles.kpis}>
          <div className={styles.kpi}>
            <div className={styles.kpiLbl}>Cobertura</div>
            <div className={styles.kpiNum}>{resumen.cobertura}%</div>
            <div className={styles.kpiSub}>{resumen.respuestasSemana} respuestas / {resumen.totalEstudiantes} estudiantes</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiLbl}>Tasa de riesgo</div>
            <div className={styles.kpiNum}>{resumen.tasaRiesgo}%</div>
            <div className={styles.kpiSub}>{resumen.respuestasRiesgo} respuestas medio/alto esta semana</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiLbl}>Alertas pendientes</div>
            <div className={`${styles.kpiNum} ${styles.kpiNumAlert}`}>{resumen.alertasPendientes}</div>
            <div className={styles.kpiSub}>requieren tu revisión</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiLbl}>Score promedio</div>
            <div className={styles.kpiNum}>{resumen.promedioScore}</div>
            <div className={styles.kpiSub}>{resumen.riesgoAlto} riesgo alto · {resumen.quierenHablar} quieren hablar</div>
          </div>
        </div>

        {/* ── Distribución y tendencia ── */}
        <div className={styles.glabel}>Distribución y tendencia</div>
        <div className={styles.charts}>

          <div className={styles.chart}>
            <h3 className={styles.chartTitle}>Distribución de riesgo</h3>
            <div className={styles.chartDesc}>
              Proporción de niveles de riesgo en las respuestas recientes.
            </div>
            <div className={styles.bars}>
              <div className={styles.barCol}>
                <span className={styles.barVal}>{pBajo}%</span>
                <div className={`${styles.bar} ${styles.barLow}`}  style={{ height: `${pBajo}%` }} />
                <span className={styles.barLbl}>Bajo</span>
              </div>
              <div className={styles.barCol}>
                <span className={styles.barVal}>{pMedio}%</span>
                <div className={`${styles.bar} ${styles.barMid}`}  style={{ height: `${pMedio}%` }} />
                <span className={styles.barLbl}>Medio</span>
              </div>
              <div className={styles.barCol}>
                <span className={styles.barVal}>{pAlto}%</span>
                <div className={`${styles.bar} ${styles.barHigh}`} style={{ height: `${pAlto}%` }} />
                <span className={styles.barLbl}>Alto</span>
              </div>
            </div>
          </div>

          <div className={styles.chart}>
            <h3 className={styles.chartTitle}>Tendencia diaria</h3>
            <div className={styles.chartDesc}>
              Evolución del score promedio en los últimos 7 días.
            </div>
            <div className={styles.lineWrap}>
              {linePoints ? (
                <svg className={styles.lineSvg} viewBox="0 0 320 160" preserveAspectRatio="none">
                  <polyline fill="rgba(58,125,68,.08)" stroke="none"    points={fillPoints} />
                  <polyline fill="none" stroke="#3a7d44" strokeWidth="2.5" points={linePoints} />
                </svg>
              ) : (
                <div className={styles.noData}>Sin datos suficientes</div>
              )}
            </div>
            <div className={styles.legend}>
              <span className={styles.leg}>
                <span className={styles.sw} style={{ background: '#3a7d44' }} />
                Score promedio (sube = mejor)
              </span>
            </div>
          </div>
        </div>

        {/* ── Indicadores de conducta ── */}
        <div className={styles.glabel}>Indicadores de conducta</div>
        <div className={styles.indGrid}>
          {ind0 && (
            <div className={styles.ind}>
              <div className={styles.indTop}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <span>{ind0.indicador}</span>
              </div>
              <div className={styles.indV}>
                {ind0.valor}<span className={styles.indVscale}> / 10</span>
              </div>
              <div className={styles.indVsub}>{ind0.descripcion}</div>
            </div>
          )}
          {ind1 && (
            <div className={styles.ind}>
              <div className={styles.indTop}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>
                  <path d="M12 9v4M12 17h.01"/>
                </svg>
                <span>{ind1.indicador}</span>
              </div>
              <div className={`${styles.indV} ${styles.indVAlert}`}>{ind1.valor}</div>
              <div className={styles.indVsub}>{ind1.descripcion}</div>
            </div>
          )}
        </div>

        {/* ── Proyección predictiva ── */}
        <div className={styles.glabel}>Proyección predictiva</div>
        <div className={styles.pred}>
          <div>
            <h3 className={styles.predTitle}>Próxima semana</h3>
            <div className={styles.predDesc}>
              Proyección heurística basada en las dos últimas ventanas de 7 días.
            </div>
            <div className={styles.predStats}>
              <div className={styles.predStat}>
                <div className={styles.predStatL}>Score proyectado</div>
                <div className={styles.predStatN}>{prediccion.prediccionProximaSemana}</div>
              </div>
              <div className={styles.predStat}>
                <div className={styles.predStatL}>Riesgo estimado</div>
                <div className={styles.predStatN}>{riesgoEstimado}%</div>
              </div>
            </div>
          </div>
          <div className={styles.conf}>
            <div className={styles.confL}>Confianza del modelo</div>
            <div className={styles.confN}>{prediccion.confianza}%</div>
          </div>
        </div>

      </div>
    </div>
  );
}

function calcLinePoints(data: TendenciaEmocionalItem[]): string {
  if (data.length < 2) return '';
  const scores   = data.map(d => d.promedio);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const range    = maxScore - minScore || 1;
  const W = 320, H = 160, pad = 16;
  return data
    .map((d, i) => {
      const x = Math.round((i / (data.length - 1)) * W);
      const y = Math.round(H - pad - ((d.promedio - minScore) / range) * (H - pad * 2));
      return `${x},${y}`;
    })
    .join(' ');
}
