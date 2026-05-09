import Link from 'next/link';
import { Users, Search } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export default async function EstudiantesPsicologo({
  searchParams,
}: { searchParams: { q?: string; gradoId?: string } }) {
  const where: any = { estadoMatricula: 'DEFINITIVA' };
  if (searchParams.q) {
    where.OR = [
      { nombres: { contains: searchParams.q.toUpperCase() } },
      { apellidoPaterno: { contains: searchParams.q.toUpperCase() } },
      { apellidoMaterno: { contains: searchParams.q.toUpperCase() } },
    ];
  }
  if (searchParams.gradoId) where.section = { gradeId: searchParams.gradoId };

  const [students, grades] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        section: { include: { grade: true } },
        apoderados: true,
        _count: { select: { responses: true } },
      },
      orderBy: [{ apellidoPaterno: 'asc' }],
      take: 200,
    }),
    prisma.grade.findMany({ orderBy: [{ nivel: 'asc' }, { order: 'asc' }] }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Users className="w-6 h-6 text-brand-600" /> Estudiantes
      </h1>

      <form className="card flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="label text-xs">Buscar por nombre o apellido</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input name="q" defaultValue={searchParams.q || ''} className="input pl-10" placeholder="Ej. García..." />
          </div>
        </div>
        <div>
          <label className="label text-xs">Grado</label>
          <select name="gradoId" defaultValue={searchParams.gradoId || ''} className="input">
            <option value="">Todos</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'} {g.name}</option>)}
          </select>
        </div>
        <button className="btn-primary" type="submit">Filtrar</button>
      </form>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Apellidos y nombres</th>
              <th className="text-left px-4 py-3">Grado</th>
              <th className="text-left px-4 py-3">Emergencia</th>
              <th className="text-center px-4 py-3">Edad</th>
              <th className="text-center px-4 py-3">Respuestas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const emergency =
                s.apoderados.find((a) => a.esContactoPrincipal) ||
                s.apoderados.find((a) => a.parentesco === 'APODERADO') ||
                s.apoderados[0];
              return (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{s.apellidoPaterno} {s.apellidoMaterno}, {s.nombres}</td>
                  <td className="px-4 py-3 text-xs">{s.section.grade.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'} {s.section.grade.name} {s.section.name}</td>
                  <td className="px-4 py-3 text-xs">
                    {emergency ? (
                      <>
                        <p className="font-medium text-slate-700">{emergency.apellidosNombres}</p>
                        <p className="text-slate-500">{emergency.celular || 'Sin celular'}</p>
                      </>
                    ) : (
                      <span className="text-slate-400">Sin contacto</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">{s.edad}</td>
                  <td className="px-4 py-3 text-center">{s._count.responses}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/psicologo/estudiantes/${s.id}`} className="text-brand-600 text-sm hover:underline">Histórico →</Link>
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-12">No hay estudiantes que coincidan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
