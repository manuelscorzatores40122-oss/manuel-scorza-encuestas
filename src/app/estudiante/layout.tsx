import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StudentMobileBottomNav } from '@/components/NavMovilEstudiante';
import { AppBarEstudiante } from '@/components/AppBarEstudiante';
import { BarraLateral } from './BarraLateral';
import { RegistrarSW } from '@/components/RegistrarSW';
import styles from './layout.module.css';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') redirect('/login');

  const student = await prisma.student.findUnique({
    where:  { userId: session.userId },
    select: { id: true, sectionId: true, section: { select: { gradeId: true } } },
  });

  let pendingSurveys   = 0;
  let announcementsCount = 0;

  if (student) {
    const gradeId   = student.section?.gradeId ?? '';
    const sectionId = student.sectionId        ?? '';

    const [allActive, totalAnnouncements] = await Promise.all([
      prisma.survey.findMany({
        where:  { isActive: true, responses: { none: { studentId: student.id } } },
        select: { targetGrades: true, targetSections: true },
      }),
      prisma.announcement.count({
        where: {
          isPublished: true,
          OR: [
            { targetRoles: { has: 'STUDENT' } },
            { targetRoles: { isEmpty: true } },
          ],
        },
      }),
    ]);

    pendingSurveys = allActive.filter(s => {
      const tg = s.targetGrades   ?? [];
      const ts = s.targetSections ?? [];
      return (tg.length === 0 || tg.includes(gradeId))
          && (ts.length === 0 || ts.includes(sectionId));
    }).length;

    announcementsCount = totalAnnouncements;
  }

  return (
    <div className={styles.shell}>
      <RegistrarSW />
      <AppBarEstudiante pendingSurveys={pendingSurveys} announcementsCount={announcementsCount} />
      <BarraLateral     pendingSurveys={pendingSurveys} announcementsCount={announcementsCount} />
      <main className={styles.main}>
        <div className={styles.pageWrapper}>{children}</div>
      </main>
      <StudentMobileBottomNav pendingSurveys={pendingSurveys} announcementsCount={announcementsCount} />
    </div>
  );
}
