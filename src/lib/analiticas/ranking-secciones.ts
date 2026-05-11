import { prisma } from '@/lib/prisma';

export type IndicadorConductual = {
  indicador: string;
  valor: number;
  descripcion: string;
  severidad: 'LOW' | 'MID' | 'HIGH';
};

export async function obtenerIndicadoresConductuales(): Promise<IndicadorConductual[]> {
  const [resumen, alertasPorSeveridad, estudiantesRecurrentes] = await Promise.all([
    prisma.response.aggregate({
      _count: true,
      _avg: { riskScore: true },
      where: {
        submittedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    prisma.alert.groupBy({
      by: ['severity'],
      _count: true,
      where: {
        triggeredAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    prisma.response.groupBy({
      by: ['studentId'],
      _count: true,
      where: {
        riskLevel: { in: ['MID', 'HIGH'] },
        submittedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  const totalAlertas = alertasPorSeveridad.reduce((sum, item) => sum + item._count, 0);
  const alertasAltas = alertasPorSeveridad
    .filter((item) => item.severity === 'HIGH')
    .reduce((sum, item) => sum + item._count, 0);
  const promedio = Math.round((resumen._avg.riskScore || 0) * 10) / 10;
  const recurrentes = estudiantesRecurrentes.filter((item) => item._count >= 2).length;

  return [
    {
      indicador: 'Score emocional promedio',
      valor: promedio,
      descripcion: 'Promedio de riesgo acumulado en los últimos 30 días.',
      severidad: promedio >= 70 ? 'HIGH' : promedio >= 40 ? 'MID' : 'LOW',
    },
    {
      indicador: 'Alertas críticas',
      valor: alertasAltas,
      descripcion: 'Alertas de severidad alta activadas recientemente.',
      severidad: alertasAltas >= 5 ? 'HIGH' : alertasAltas > 0 ? 'MID' : 'LOW',
    },
    {
      indicador: 'Riesgo recurrente',
      valor: recurrentes,
      descripcion: 'Estudiantes con dos o más respuestas de riesgo en 30 días.',
      severidad: recurrentes >= 5 ? 'HIGH' : recurrentes > 0 ? 'MID' : 'LOW',
    },
    {
      indicador: 'Volumen de alertas',
      valor: totalAlertas,
      descripcion: 'Total de alertas generadas por el motor psicológico.',
      severidad: totalAlertas >= 15 ? 'HIGH' : totalAlertas >= 5 ? 'MID' : 'LOW',
    },
  ];
}
