import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DatabaseUnavailable } from '@/components/DatabaseUnavailable';

export default async function EncuestasEstudiante() {
  const session = (await getSession())!;

  try {
    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      include: { section: true },
    });

    if (!student) return null;

    const surveys = await prisma.survey.findMany({
      where: {
        isActive: true,

        // No mostrar encuestas que el estudiante ya respondió
        responses: {
          none: {
            studentId: student.id,
          },
        },

        // Mostrar solo encuestas de su grado o encuestas generales
        OR: [
          { targetGrades: { has: student.section.gradeId } },
          { targetGrades: { isEmpty: true } },
        ],
        AND: [
          {
            OR: [
              { targetSections: { has: student.sectionId } },
              { targetSections: { isEmpty: true } },
            ],
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Encuestas disponibles</h1>

        <div className="grid gap-4 md:grid-cols-2">
          {surveys.map((s) => (
            <Link
              key={s.id}
              href={`/estudiante/encuestas/${s.id}`}
              className="card hover:shadow-md hover:-translate-y-0.5 transition-all border-2 border-transparent hover:border-warm-300"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-warm-100 text-warm-600 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">
                    {s.title}
                  </h3>

                  {s.description && (
                    <p className="text-sm text-slate-600 mt-1">
                      {s.description}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 mt-2">
                    {s._count.questions} preguntas
                  </p>
                </div>
              </div>
            </Link>
          ))}

          {surveys.length === 0 && (
            <p className="text-slate-500 col-span-full text-center py-12">
              No hay encuestas activas.
            </p>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error cargando encuestas del estudiante:', error);
    return <DatabaseUnavailable />;
  }
}
