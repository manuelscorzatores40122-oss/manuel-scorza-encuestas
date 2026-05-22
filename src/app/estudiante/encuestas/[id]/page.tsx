import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FormularioEncuesta } from './FormularioEncuesta';

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

  // Validar destinatarios
  const targetGrades = survey.targetGrades || [];
  const targetSections = survey.targetSections || [];

  if (
    targetGrades.length > 0 &&
    !targetGrades.includes(student.section.gradeId)
  ) {
    return (
      <div className="card max-w-md mx-auto text-center">
        <p className="text-slate-700">
          Esta encuesta no está disponible para tu grado.
        </p>
      </div>
    );
  }

  if (
    targetSections.length > 0 &&
    !targetSections.includes(student.sectionId)
  ) {
    return (
      <div className="card max-w-md mx-auto text-center">
        <p className="text-slate-700">
          Esta encuesta no está disponible para tu sección.
        </p>
      </div>
    );
  }

  // Si ya respondió → redirigir con mensaje
  if (existingResponse) {
    redirect('/estudiante?message=encuesta-respondida');
  }

  // Mostrar formulario
  return <FormularioEncuesta survey={survey} />;
}
