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

  // Buscar encuesta
  const survey = await prisma.survey.findUnique({
    where: {
      id: params.id,
    },

    include: {
      questions: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

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

  // Verificar si ya respondió
  const existingResponse = await prisma.response.findFirst({
    where: {
      surveyId: survey.id,
      studentId: student.id,
    },
  });

  // Si ya respondió → redirigir con mensaje
  if (existingResponse) {
    redirect('/estudiante?message=encuesta-respondida');
  }

  // Mostrar formulario
  return <SurveyForm survey={survey} />;
}