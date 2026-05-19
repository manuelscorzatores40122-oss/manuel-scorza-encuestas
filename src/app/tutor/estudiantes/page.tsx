import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Users } from 'lucide-react';

export default async function TutorEstudiantes() {
  const session = (await getSession())!;
  const sections = await prisma.section.findMany({
    where: { tutorId: session.userId },
    include: {
      grade: true,
      students: {
        where: { estadoMatricula: 'DEFINITIVA' },
        orderBy: { apellidoPaterno: 'asc' },
        include: { _count: { select: { responses: true } } },
      },
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Users className="w-6 h-6 text-brand-600" /> Mis estudiantes
      </h1>

      {sections.map((sec) => (
        <div key={sec.id} className="card">
          <h2 className="font-semibold mb-3">
            {sec.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'} · {sec.grade.name} {sec.name} ({sec.students.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-600">
                <tr>
                  <th className="text-left py-2">DNI</th>
                  <th className="text-left py-2">Apellidos y nombres</th>
                  <th className="text-center py-2">Edad</th>
                  <th className="text-center py-2">Sexo</th>
                  <th className="text-center py-2">Respuestas</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {sec.students.map((st) => (
                  <tr key={st.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="py-2 font-mono text-xs">{st.dni}</td>
                    <td className="py-2">{st.apellidoPaterno} {st.apellidoMaterno}, {st.nombres}</td>
                    <td className="py-2 text-center">{st.edad}</td>
                    <td className="py-2 text-center">{st.sexo}</td>
                    <td className="py-2 text-center">{st._count.responses}</td>
                    <td className="py-2 text-right">
                      <Link href={`/tutor/estudiantes/${st.id}`} className="text-brand-600 text-xs hover:underline">
                        Ver ficha →
                      </Link>
                    </td>
                  </tr>
                ))}
                {sec.students.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-slate-500">Sin estudiantes.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {sections.length === 0 && (
        <p className="text-slate-500 text-center py-8">No tienes secciones asignadas.</p>
      )}
    </div>
  );
}
