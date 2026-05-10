import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SurveyForm } from './SurveyForm';

export default async function ResponderEncuesta({
  params,
}: {
  params: { id: string };
}) {

  // Obtener sesión
  const session = await getSession();

  // Si no hay sesión → login
  if (!session) {
    redirect('/login');
  }

  // Buscar estudiante
  const student = await prisma.student.findUnique({
    where: {
      userId: session.userId,
    },

    include: {
      section: true,
    },
  });

  // Si no existe estudiante
  if (!student) {
    redirect('/login');
  }

  const [survey, existingResponse] = await Promise.all([
    prisma.survey.findUnique({
      where: { id: params.id },
      include: { questions: { orderBy: { order: 'asc' } } },
    }),
    prisma.response.findFirst({
      where: {
        surveyId: params.id,
        studentId: student.id,
      },
      select: { id: true },
    }),
  ]);

  // Encuesta inválida
  if (!survey || !survey.isActive) {
    notFound();
  }

  // Validar grado
  const targets = survey.targetGrades || [];

  if (
    targets.length > 0 &&
    !targets.includes(student.section.gradeId)
  ) {
    return (
      <div className="card max-w-md mx-auto text-center">
        <p className="text-slate-700">
          Esta encuesta no está disponible para tu grado.
        </p>
      </div>
    );
  }

  // Si ya respondió → redirigir con mensaje
  if (existingResponse) {
    redirect('/estudiante?message=encuesta-respondida');
  }

  // Mostrar formulario
  return <SurveyForm survey={survey} />;
}
