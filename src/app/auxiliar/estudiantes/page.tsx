import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Users, Search } from 'lucide-react';

export default async function AuxiliarEstudiantes({
  searchParams,
}: { searchParams: { q?: string; gradoId?: string } }) {
  const where: any = { estadoMatricula: 'DEFINITIVA' };
  if (searchParams.q) {
    where.OR = [
      { dni: { contains: searchParams.q } },
      { nombres: { contains: searchParams.q.toUpperCase() } },
      { apellidoPaterno: { contains: searchParams.q.toUpperCase() } },
    ];
  }
  if (searchParams.gradoId) where.section = { gradeId: searchParams.gradoId };

  const [students, grades] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { section: { include: { grade: true } } },
      orderBy: [{ apellidoPaterno: 'asc' }],
      take: 300,
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
          <label className="label text-xs">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input name="q" defaultValue={searchParams.q || ''} className="input pl-10" placeholder="DNI o apellido..." />
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
              <th className="text-left px-4 py-3">DNI</th>
              <th className="text-left px-4 py-3">Apellidos y nombres</th>
              <th className="text-left px-4 py-3">Grado</th>
              <th className="text-center px-4 py-3">Edad</th>
              <th className="text-center px-4 py-3">Sexo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{s.dni}</td>
                <td className="px-4 py-3">{s.apellidoPaterno} {s.apellidoMaterno}, {s.nombres}</td>
                <td className="px-4 py-3 text-xs">{s.section.grade.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'} {s.section.grade.name} {s.section.name}</td>
                <td className="px-4 py-3 text-center">{s.edad}</td>
                <td className="px-4 py-3 text-center">{s.sexo}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/auxiliar/estudiantes/${s.id}`} className="text-brand-600 text-xs hover:underline">
                    Ver ficha →
                  </Link>
                </td>
              </tr>
            ))}
            {students.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">Sin resultados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
