import { prisma } from '@/lib/prisma';
import { ConstructorEncuesta } from './ConstructorEncuesta';

export default async function NuevaEncuestaPage() {
  const grades = await prisma.grade.findMany({
    orderBy: [{ nivel: 'asc' }, { order: 'asc' }],
    include: {
      sections: {
        orderBy: {
          name: 'asc',
        },
      },
    },
  });
  return <ConstructorEncuesta grades={grades} />;
}
