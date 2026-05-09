import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SurveyForm } from './SurveyForm';

export default async function ResponderEncuesta({ params }: { params: { id: string } }) {
  const session = (await getSession())!;
  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    include: { section: true },
  });
  if (!student) redirect('/login');

  const survey = await prisma.survey.findUnique({
    where: { id: params.id },
    include: { questions: { orderBy: { order: 'asc' } } },
  });

  if (!survey || !survey.isActive) notFound();

  // Verificar que la encuesta apunta a este grado
  const targets = survey.targetGrades || [];
  if (targets.length > 0 && !targets.includes(student.section.gradeId)) {
    return (
      <div className="card max-w-md mx-auto text-center">
        <p className="text-slate-700">Esta encuesta no está disponible para tu grado.</p>
      </div>
    );
  }

  return <SurveyForm survey={survey} />;
}
