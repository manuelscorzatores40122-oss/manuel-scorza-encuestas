import Link from 'next/link';
import { FileBarChart } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import { RiskBadge } from '@/components/RiskBadge';

export default async function RespuestasPsicologo({
  searchParams,
}: { searchParams: { riesgo?: string; gradoId?: string; surveyId?: string } }) {
  const where: any = {};
  if (searchParams.riesgo) where.riskLevel = searchParams.riesgo;
  if (searchParams.surveyId) where.surveyId = searchParams.surveyId;
  if (searchParams.gradoId) where.student = { section: { gradeId: searchParams.gradoId } };

  const [responses, surveys, grades] = await Promise.all([
    prisma.response.findMany({
      where,
      include: {
        student: { include: { section: { include: { grade: true } } } },
        survey: true,
      },
      orderBy: { submittedAt: 'desc' },
      take: 200,
    }),
    prisma.survey.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.grade.findMany({ orderBy: [{ nivel: 'asc' }, { order: 'asc' }] }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileBarChart className="w-6 h-6 text-brand-600" /> Respuestas
        </h1>
        <p className="text-xs text-slate-500">Los documentos de identidad solo son visibles para administración.</p>
      </div>

      <form className="card flex flex-wrap gap-3 items-end">
        <div>
          <label className="label text-xs">Encuesta</label>
          <select name="surveyId" defaultValue={searchParams.surveyId || ''} className="input">
            <option value="">Todas</option>
            {surveys.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label text-xs">Grado</label>
          <select name="gradoId" defaultValue={searchParams.gradoId || ''} className="input">
            <option value="">Todos</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'} {g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label text-xs">Nivel de riesgo</label>
          <select name="riesgo" defaultValue={searchParams.riesgo || ''} className="input">
            <option value="">Todos</option>
            <option value="LOW">Sin riesgo</option>
            <option value="MID">Medio</option>
            <option value="HIGH">Alto</option>
          </select>
        </div>
        <button className="btn-primary" type="submit">Filtrar</button>
      </form>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-left px-4 py-3">Estudiante</th>
              <th className="text-left px-4 py-3">Grado</th>
              <th className="text-left px-4 py-3">Encuesta</th>
              <th className="text-center px-4 py-3">Riesgo</th>
              <th className="text-center px-4 py-3">Score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {responses.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(r.submittedAt)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{r.student.nombres} {r.student.apellidoPaterno}</p>
                </td>
                <td className="px-4 py-3 text-xs">
                  {r.student.section.grade.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'} {r.student.section.grade.name} {r.student.section.name}
                </td>
                <td className="px-4 py-3">{r.survey.title}</td>
                <td className="px-4 py-3 text-center"><RiskBadge level={r.riskLevel} /></td>
                <td className="px-4 py-3 text-center font-mono">{r.riskScore}</td>
                <td className="px-4 py-3">
                  <Link href={`/psicologo/respuestas/${r.id}`} className="text-brand-600 text-sm hover:underline">Ver</Link>
                </td>
              </tr>
            ))}
            {responses.length === 0 && (
              <tr><td colSpan={7} className="text-center text-slate-500 py-12">Sin respuestas para los filtros aplicados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
