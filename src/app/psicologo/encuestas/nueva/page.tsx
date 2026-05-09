import { prisma } from '@/lib/prisma';
import { SurveyBuilder } from './SurveyBuilder';

export default async function NuevaEncuestaPage() {
  const grades = await prisma.grade.findMany({
    orderBy: [{ nivel: 'asc' }, { order: 'asc' }],
  });
  return <SurveyBuilder grades={grades} />;
}
