import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StudentMobileBottomNav } from '@/components/NavMovilEstudiante';
import { BarraLateral } from './BarraLateral';
import styles from './layout.module.css';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') redirect('/login');

  const student = await prisma.student.findUnique({
    where:  { userId: session.userId },
    select: { id: true, sectionId: true, section: { select: { gradeId: true } } },
  });

  const pendingSurveys = student
    ? await prisma.survey.count({
        where: {
          isActive: true,
          responses: { none: { studentId: student.id } },
          OR: [
            { targetGrades: { has: student.section.gradeId } },
            { targetGrades: { isEmpty: true } },
          ],
          AND: [{
            OR: [
              { targetSections: { has: student.sectionId } },
              { targetSections: { isEmpty: true } },
            ],
          }],
        },
      })
    : 0;

  return (
    <div className={styles.shell}>
      <BarraLateral pendingSurveys={pendingSurveys} />
      <main className={styles.main}>
        <div className={styles.pageWrapper}>{children}</div>
      </main>
      <StudentMobileBottomNav pendingSurveys={pendingSurveys} />
    </div>
  );
}
