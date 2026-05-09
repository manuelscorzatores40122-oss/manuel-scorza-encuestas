import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import { History } from 'lucide-react';

export default async function HistorialEstudiante() {
  const session = (await getSession())!;
  const student = await prisma.student.findUnique({ where: { userId: session.userId } });
  if (!student) return null;

  const responses = await prisma.response.findMany({
    where: { studentId: student.id },
    include: { survey: true },
    orderBy: { submittedAt: 'desc' },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <History className="w-6 h-6 text-brand-600" />
        Mi historial
      </h1>

      {responses.length === 0 ? (
        <div className="card text-center text-slate-500 py-12">
          Aún no has respondido ninguna encuesta.
        </div>
      ) : (
        <div className="space-y-3">
          {responses.map((r) => (
            <div key={r.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{r.survey.title}</p>
                <p className="text-sm text-slate-500">{formatDateTime(r.submittedAt)}</p>
              </div>
              <span className="text-sm text-emerald-600 font-medium">✓ Enviada</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 text-center">
        Tus respuestas son privadas.
      </p>
    </div>
  );
}
