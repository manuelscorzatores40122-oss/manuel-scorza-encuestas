import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import { FileBarChart } from 'lucide-react';

export default async function TutorRespuestas() {
  const session = (await getSession())!;
  const sections = await prisma.section.findMany({
    where: { tutorId: session.userId },
    select: { id: true },
  });
  const sectionIds = sections.map((s) => s.id);

  const responses = await prisma.response.findMany({
    where: { student: { sectionId: { in: sectionIds } } },
    include: {
      student: { include: { section: { include: { grade: true } } } },
      survey: true,
    },
    orderBy: { submittedAt: 'desc' },
    take: 200,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <FileBarChart className="w-6 h-6 text-brand-600" /> Respuestas de mi sección
      </h1>
      <p className="text-slate-600 text-sm">
        Como tutor puedes ver el contenido de las respuestas, pero no las alertas de riesgo (esa información es solo del psicólogo).
      </p>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-left px-4 py-3">Estudiante</th>
              <th className="text-left px-4 py-3">Encuesta</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(r.submittedAt)}</td>
                <td className="px-4 py-3">{r.student.apellidoPaterno} {r.student.apellidoMaterno}, {r.student.nombres}</td>
                <td className="px-4 py-3">{r.survey.title}</td>
              </tr>
            ))}
            {responses.length === 0 && <tr><td colSpan={3} className="text-center text-slate-500 py-8">No hay respuestas aún.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
