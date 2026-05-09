import { prisma } from '@/lib/prisma';
import { BarChart3 } from 'lucide-react';

export default async function ReportesDirector() {
  const surveys = await prisma.survey.findMany({
    include: { _count: { select: { responses: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const totalsByLevel = await prisma.response.groupBy({
    by: ['riskLevel'],
    _count: true,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-brand-600" /> Reportes
      </h1>

      <div className="card">
        <h2 className="font-semibold mb-4">Encuestas y participación</h2>
        <table className="w-full text-sm">
          <thead className="text-slate-600">
            <tr>
              <th className="text-left py-2">Encuesta</th>
              <th className="text-center py-2">Estado</th>
              <th className="text-right py-2">Respuestas</th>
            </tr>
          </thead>
          <tbody>
            {surveys.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="py-2">{s.title}</td>
                <td className="py-2 text-center">
                  <span className={`badge ${s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {s.isActive ? 'Activa' : 'Cerrada'}
                  </span>
                </td>
                <td className="py-2 text-right font-medium">{s._count.responses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Resumen global de riesgo</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-emerald-50">
            <p className="text-xs text-slate-500">Sin riesgo</p>
            <p className="text-2xl font-bold text-emerald-700">{totalsByLevel.find((t) => t.riskLevel === 'LOW')?._count || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-yellow-50">
            <p className="text-xs text-slate-500">Riesgo medio</p>
            <p className="text-2xl font-bold text-yellow-700">{totalsByLevel.find((t) => t.riskLevel === 'MID')?._count || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-red-50">
            <p className="text-xs text-slate-500">Riesgo alto</p>
            <p className="text-2xl font-bold text-red-700">{totalsByLevel.find((t) => t.riskLevel === 'HIGH')?._count || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
