import { prisma } from '@/lib/prisma';

export async function obtenerResumenPsicologico() {
  const [
    totalEstudiantes,
    respuestasSemana,
    alertasPendientes,
    riesgoAlto,
    respuestasRiesgo,
    quierenHablar,
    promedioScore,
  ] =
    await Promise.all([
      prisma.student.count({
        where: {
          estadoMatricula: 'DEFINITIVA',
        },
      }),

      prisma.response.count({
        where: {
          submittedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      prisma.alert.count({
        where: {
          reviewedAt: null,
        },
      }),

      prisma.response.count({
        where: {
          riskLevel: 'HIGH',
          submittedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      prisma.response.count({
        where: {
          riskLevel: { in: ['MID', 'HIGH'] },
          submittedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      prisma.response.count({
        where: {
          wantsToTalk: true,
          submittedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      prisma.response.aggregate({
        _avg: { riskScore: true },
        where: {
          submittedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

  return {
    totalEstudiantes,
    respuestasSemana,
    alertasPendientes,
    riesgoAlto,
    respuestasRiesgo,
    quierenHablar,
    tasaRiesgo: respuestasSemana
      ? Math.round((respuestasRiesgo / respuestasSemana) * 1000) / 10
      : 0,
    cobertura: totalEstudiantes
      ? Math.round((respuestasSemana / totalEstudiantes) * 1000) / 10
      : 0,
    promedioScore: Math.round((promedioScore._avg.riskScore || 0) * 10) / 10,
  };
}
