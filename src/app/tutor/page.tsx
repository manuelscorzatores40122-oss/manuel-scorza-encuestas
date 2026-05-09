import Link from 'next/link';
import { Users, FileBarChart, Info } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function TutorHome() {
  const session = (await getSession())!;
  const sections = await prisma.section.findMany({
    where: { tutorId: session.userId },
    include: {
      grade: true,
      students: { where: { estadoMatricula: 'DEFINITIVA' } },
    },
  });

  if (sections.length === 0) {
    return (
      <div className="card max-w-md mx-auto text-center">
        <Info className="w-10 h-10 mx-auto text-slate-400 mb-3" />
        <p className="text-slate-700">Aún no tienes una sección asignada.</p>
        <p className="text-sm text-slate-500 mt-2">Solicita al administrador que te asigne tu sección.</p>
      </div>
    );
  }

  // Contar respuestas de mis secciones
  const sectionIds = sections.map((s) => s.id);
  const responses = await prisma.response.count({
    where: { student: { sectionId: { in: sectionIds } } },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold">Panel del Tutor</h1>
        <p className="text-slate-600 mt-1">Acompañamiento de tu sección asignada</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {sections.map((s) => (
          <div key={s.id} className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'}</p>
                <p className="text-lg font-bold">{s.grade.name} {s.name}</p>
                <p className="text-sm text-slate-600">{s.students.length} estudiantes</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Link href="/tutor/estudiantes" className="card hover:shadow-md transition-shadow">
          <Users className="w-6 h-6 text-brand-600 mb-2" />
          <p className="font-semibold">Ver estudiantes</p>
          <p className="text-xs text-slate-500 mt-1">Lista de tu sección</p>
        </Link>
        <Link href="/tutor/respuestas" className="card hover:shadow-md transition-shadow">
          <FileBarChart className="w-6 h-6 text-brand-600 mb-2" />
          <p className="font-semibold">Respuestas recientes</p>
          <p className="text-xs text-slate-500 mt-1">{responses} respuestas registradas</p>
        </Link>
      </div>

      <div className="card bg-slate-50 border-slate-200">
        <p className="text-sm text-slate-700">
          ℹ️ Como tutor, puedes ver las respuestas no anónimas de los estudiantes de tu sección, pero no las alertas de riesgo. Si detectas algo preocupante, comunícalo al psicólogo.
        </p>
      </div>
    </div>
  );
}
