import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import { FileBarChart } from 'lucide-react';

export default async function AuxiliarRespuestas() {
  const responses = await prisma.response.findMany({
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
        <FileBarChart className="w-6 h-6 text-brand-600" /> Respuestas
      </h1>
      <p className="text-slate-600 text-sm">
        Las alertas de riesgo solo son visibles para el psicólogo. Si detectas algo preocupante, repórtalo.
      </p>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-left px-4 py-3">Estudiante</th>
              <th className="text-left px-4 py-3">Grado</th>
              <th className="text-left px-4 py-3">Encuesta</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(r.submittedAt)}</td>
                <td className="px-4 py-3">{r.student.apellidoPaterno} {r.student.apellidoMaterno}, {r.student.nombres}</td>
                <td className="px-4 py-3 text-xs">{r.student.section.grade.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'} {r.student.section.grade.name} {r.student.section.name}</td>
                <td className="px-4 py-3">{r.survey.title}</td>
              </tr>
            ))}
            {responses.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-8">No hay respuestas aún.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
