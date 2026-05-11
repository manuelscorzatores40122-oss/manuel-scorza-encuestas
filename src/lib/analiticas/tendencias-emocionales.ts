
// src/lib/analiticas/tendencias-emocionales.ts

import { prisma } from '@/lib/prisma';

export type TendenciaEmocionalItem = {
  fecha: string;
  total: number;
  riesgo: number;
  promedio: number;
  quierenHablar: number;
  tasaRiesgo: number;
};

export async function obtenerTendenciasEmocionales() {
  return prisma.$queryRaw<TendenciaEmocionalItem[]>`
    WITH diaria AS (
      SELECT
      DATE_TRUNC('day', r."submittedAt") AS dia,

      TO_CHAR(
        DATE_TRUNC('day', r."submittedAt"),
        'DD/MM'
      ) AS fecha,

      COUNT(r.id)::int AS total,

      COUNT(*) FILTER (
        WHERE r."riskFlag" = true
      )::int AS riesgo,

      ROUND(
        AVG(r."riskScore")::numeric,
        2
      )::float AS promedio,

      COUNT(*) FILTER (
        WHERE r."wantsToTalk" = true
      )::int AS "quierenHablar"

    FROM "Response" r

    WHERE r."submittedAt"
      >= NOW() - INTERVAL '30 days'

    GROUP BY DATE_TRUNC('day', r."submittedAt")
    )

    SELECT
      fecha,
      total,
      riesgo,
      promedio,
      "quierenHablar",
      ROUND((riesgo::numeric / NULLIF(total, 0)) * 100, 1)::float
        AS "tasaRiesgo"
    FROM diaria

    ORDER BY dia;
  `;
}
