import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NavbarPsicologo } from './NavbarPsicologo';
import { PsicologoMobileBottomNav } from '@/components/NavMovilPsicologo';
import styles from './psicologo-layout.module.css';

export default async function PsicologoLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'PSYCHOLOGIST') redirect('/login');

  const [user, alertCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true, username: true },
    }),
    prisma.alert.count({ where: { reviewedAt: null } }),
  ]);

  const userName  = user?.fullName || 'Psicólogo';
  const userEmail = user?.username || '';

  return (
    <div className={styles.shell}>
      <NavbarPsicologo userName={userName} userEmail={userEmail} alertCount={alertCount} />
      <main className={styles.main}>
        <div className={styles.pageWrapper}>{children}</div>
      </main>
      <PsicologoMobileBottomNav />
    </div>
  );
}
