
// src/lib/analiticas/riesgo-semanal.ts

import { prisma } from '@/lib/prisma';

export type RiesgoSemanalItem = {
  seccion: string;
  grado: string;
  nivel: string;
  promedioRiesgo: number;
  totalRespuestas: number;
  riesgoAlto: number;
  riesgoMedio: number;
  riesgoBajo: number;
  quierenHablar: number;
  tasaRiesgo: number;
  indiceCriticidad: number;
};

export async function obtenerRiesgoSemanal() {
  return prisma.$queryRaw<RiesgoSemanalItem[]>`
    WITH base AS (
      SELECT
      sec.name AS seccion,
      g.name AS grado,
      g.nivel::text AS nivel,

      ROUND(AVG(r."riskScore")::numeric, 2)::float
        AS "promedioRiesgo",

      COUNT(r.id)::int
        AS "totalRespuestas",

      COUNT(*) FILTER (
        WHERE r."riskLevel" = 'HIGH'
      )::int AS "riesgoAlto",

      COUNT(*) FILTER (
        WHERE r."riskLevel" = 'MID'
      )::int AS "riesgoMedio",

      COUNT(*) FILTER (
        WHERE r."riskLevel" = 'LOW'
      )::int AS "riesgoBajo",

      COUNT(*) FILTER (
        WHERE r."wantsToTalk" = true
      )::int AS "quierenHablar"

    FROM "Response" r

    INNER JOIN "Student" s
      ON s.id = r."studentId"

    INNER JOIN "Section" sec
      ON sec.id = s."sectionId"

    INNER JOIN "Grade" g
      ON g.id = sec."gradeId"

    WHERE r."submittedAt"
      >= NOW() - INTERVAL '7 days'

      GROUP BY sec.name, g.name, g.nivel
    )

    SELECT
      *,
      ROUND((("riesgoAlto" + "riesgoMedio")::numeric / NULLIF("totalRespuestas", 0)) * 100, 1)::float
        AS "tasaRiesgo",
      ROUND(("promedioRiesgo" + ("riesgoAlto" * 12) + ("quierenHablar" * 4))::numeric, 1)::float
        AS "indiceCriticidad"
    FROM base

    ORDER BY "indiceCriticidad" DESC;
  `;
}
