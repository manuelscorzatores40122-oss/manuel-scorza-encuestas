import { prisma } from '@/lib/prisma';

type VentanaRiesgo = {
  periodo: string;
  total: number;
  riesgo: number;
  alto: number;
  promedio: number;
  quierenHablar: number;
};

export type RiesgoPredictivo = {
  actual: VentanaRiesgo;
  anterior: VentanaRiesgo;
  variacionRiesgo: number;
  variacionScore: number;
  prediccionProximaSemana: number;
  nivelProyectado: 'LOW' | 'MID' | 'HIGH';
  confianza: number;
  factores: string[];
};

export async function obtenerRiesgoPredictivo(): Promise<RiesgoPredictivo> {
  const rows = await prisma.$queryRaw<VentanaRiesgo[]>`
    SELECT
      CASE
        WHEN r."submittedAt" >= NOW() - INTERVAL '7 days' THEN 'actual'
        ELSE 'anterior'
      END AS periodo,
      COUNT(r.id)::int AS total,
      COUNT(*) FILTER (WHERE r."riskLevel" IN ('MID', 'HIGH'))::int AS riesgo,
      COUNT(*) FILTER (WHERE r."riskLevel" = 'HIGH')::int AS alto,
      ROUND(AVG(r."riskScore")::numeric, 2)::float AS promedio,
      COUNT(*) FILTER (WHERE r."wantsToTalk" = true)::int AS "quierenHablar"
    FROM "Response" r
    WHERE r."submittedAt" >= NOW() - INTERVAL '14 days'
    GROUP BY periodo;
  `;

  const empty = (periodo: string): VentanaRiesgo => ({
    periodo,
    total: 0,
    riesgo: 0,
    alto: 0,
    promedio: 0,
    quierenHablar: 0,
  });

  const actual = rows.find((row) => row.periodo === 'actual') || empty('actual');
  const anterior = rows.find((row) => row.periodo === 'anterior') || empty('anterior');
  const tasaActual = actual.total ? (actual.riesgo / actual.total) * 100 : 0;
  const tasaAnterior = anterior.total ? (anterior.riesgo / anterior.total) * 100 : 0;
  const variacionRiesgo = tasaActual - tasaAnterior;
  const variacionScore = actual.promedio - anterior.promedio;
  const impulso = variacionRiesgo * 0.35 + variacionScore * 0.65;
  const prediccionProximaSemana = clamp(Math.round((actual.promedio + impulso) * 10) / 10, 0, 100);
  const confianza = Math.min(92, Math.max(35, Math.round(((actual.total + anterior.total) / 30) * 100)));
  const nivelProyectado = prediccionProximaSemana >= 70 ? 'HIGH' : prediccionProximaSemana >= 40 ? 'MID' : 'LOW';

  const factores = [
    variacionRiesgo > 5 ? 'Aumentó la proporción de respuestas con riesgo.' : '',
    variacionScore > 5 ? 'Subió el score promedio semanal.' : '',
    actual.alto > anterior.alto ? 'Hay más casos de riesgo alto que la semana previa.' : '',
    actual.quierenHablar > 0 ? 'Existen estudiantes que solicitaron hablar con psicología.' : '',
    actual.total < 10 ? 'La muestra reciente aún es baja; interpretar con cautela.' : '',
  ].filter(Boolean);

  return {
    actual,
    anterior,
    variacionRiesgo: Math.round(variacionRiesgo * 10) / 10,
    variacionScore: Math.round(variacionScore * 10) / 10,
    prediccionProximaSemana,
    nivelProyectado,
    confianza,
    factores: factores.length ? factores : ['El comportamiento reciente se mantiene estable.'],
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
