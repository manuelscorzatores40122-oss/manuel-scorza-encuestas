import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import { RiskBadge } from '@/components/RiskBadge';

export default async function DetalleRespuesta({ params }: { params: { id: string } }) {
  const r = await prisma.response.findUnique({
    where: { id: params.id },
    include: {
      student: {
        include: {
          section: { include: { grade: true } },
          apoderados: true,
        },
      },
      survey: { include: { questions: { orderBy: { order: 'asc' } } } },
      answers: true,
      alerts: { include: { rule: true } },
    },
  });
  if (!r) notFound();

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Link href="/psicologo/respuestas" className="inline-flex items-center gap-2 text-brand-600 hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{r.student.nombres} {r.student.apellidoPaterno} {r.student.apellidoMaterno}</h1>
            <p className="text-sm text-slate-500">{r.student.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'} {r.student.section.grade.name} {r.student.section.name} · {r.student.edad} años</p>
            <p className="text-xs text-slate-500 mt-1">Respondida el {formatDateTime(r.submittedAt)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <RiskBadge level={r.riskLevel} />
            <span className="text-xs text-slate-500">Score: {r.riskScore}</span>
            {r.wantsToTalk && <span className="badge bg-warm-100 text-warm-700">Pidió hablar con psicólogo</span>}
          </div>
        </div>
      </div>

      {r.alerts.length > 0 && (
        <div className="card bg-red-50 border-red-200">
          <h2 className="font-semibold text-red-900 mb-2">Alertas activadas</h2>
          <ul className="space-y-1">
            {r.alerts.map((a) => (
              <li key={a.id} className="text-sm text-red-800">
                <strong>{a.rule.name}:</strong> {a.detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-4">Respuestas</h2>
        <div className="space-y-4">
          {r.survey.questions.map((q) => {
            const ans = r.answers.find((a) => a.questionId === q.id);
            return (
              <div key={q.id} className="border-l-4 border-brand-200 pl-4 py-1">
                <p className="text-sm text-slate-500">{q.text}</p>
                <p className="font-medium text-slate-900 mt-1">{formatAnswer(ans?.value, q)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {r.student.apoderados.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-3">Contactos del apoderado</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {r.student.apoderados.map((a) => (
              <div key={a.id} className="p-3 rounded-lg bg-slate-50">
                <p className="font-medium">{a.apellidosNombres}</p>
                <p className="text-xs text-slate-500">{a.parentesco}{a.esContactoPrincipal ? ' · Contacto principal' : ''}</p>
                {a.correo && <p className="text-xs mt-1">📧 {a.correo}</p>}
                {a.celular && <p className="text-xs">📞 {a.celular}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatAnswer(value: string | undefined, q: any): string {
  if (!value) return '—';
  if (q.type === 'MULTI') {
    try {
      const arr = JSON.parse(value);
      const opts: any[] = q.options || [];
      return arr.map((v: string) => opts.find((o) => o.value === v)?.label || v).join(', ');
    } catch { return value; }
  }
  if (q.options) {
    const opts: any[] = q.options;
    const opt = opts.find((o) => o.value === value);
    if (opt) return opt.label;
  }
  return value;
}
