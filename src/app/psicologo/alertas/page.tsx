import Link from 'next/link';
import { AlertTriangle, Check } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import { RiskBadge } from '@/components/RiskBadge';
import { markAlertReviewedAction } from './actions';

export default async function AlertasPsicologo({
  searchParams,
}: { searchParams: { tab?: string } }) {
  const tab = searchParams.tab || 'pendientes';

  const where: any = {};
  if (tab === 'pendientes') where.reviewedAt = null;
  if (tab === 'revisadas') where.reviewedAt = { not: null };

  const alerts = await prisma.alert.findMany({
    where,
    include: {
      rule: true,
      response: {
        include: {
          student: { include: { section: { include: { grade: true } } } },
          survey: true,
        },
      },
    },
    orderBy: { triggeredAt: 'desc' },
    take: 200,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-red-600" /> Bandeja de alertas
      </h1>

      <div className="flex gap-1 border-b border-slate-200">
        <Link href="?tab=pendientes" className={`px-4 py-2 text-sm font-medium ${tab === 'pendientes' ? 'text-brand-700 border-b-2 border-brand-600' : 'text-slate-500'}`}>
          Pendientes
        </Link>
        <Link href="?tab=revisadas" className={`px-4 py-2 text-sm font-medium ${tab === 'revisadas' ? 'text-brand-700 border-b-2 border-brand-600' : 'text-slate-500'}`}>
          Revisadas
        </Link>
        <Link href="?tab=todas" className={`px-4 py-2 text-sm font-medium ${tab === 'todas' ? 'text-brand-700 border-b-2 border-brand-600' : 'text-slate-500'}`}>
          Todas
        </Link>
      </div>

      <div className="space-y-3">
        {alerts.map((a) => (
          <div key={a.id} className="card flex items-start gap-3 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.severity === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-semibold text-slate-900">
                    {a.response.student.nombres} {a.response.student.apellidoPaterno}
                  </p>
                  <p className="text-xs text-slate-500">
                    {a.response.student.section.grade.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'} {a.response.student.section.grade.name} {a.response.student.section.name}
                  </p>
                </div>
                <RiskBadge level={a.severity} />
              </div>
              <p className="mt-2 text-sm text-slate-700">
                <strong>{a.rule.name}:</strong> {a.detail}
              </p>
              <p className="text-xs text-slate-400 mt-1">{formatDateTime(a.triggeredAt)}</p>
              <div className="mt-3 flex gap-2 flex-wrap">
                <Link href={`/psicologo/respuestas/${a.responseId}`} className="btn-secondary text-xs !py-1.5 !px-3">
                  Ver respuesta
                </Link>
                {!a.reviewedAt && (
                  <form action={markAlertReviewedAction.bind(null, a.id)}>
                    <button className="btn-secondary text-xs !py-1.5 !px-3">
                      <Check className="w-3 h-3" /> Marcar revisada
                    </button>
                  </form>
                )}
                {a.reviewedAt && (
                  <span className="text-xs text-emerald-600 inline-flex items-center gap-1">
                    <Check className="w-3 h-3" /> Revisada {formatDateTime(a.reviewedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="card text-center text-slate-500 py-12">
            No hay alertas {tab === 'pendientes' ? 'pendientes' : tab === 'revisadas' ? 'revisadas' : ''}.
          </div>
        )}
      </div>
    </div>
  );
}
