import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NavbarDirector } from './NavbarDirector';
import styles from './director-layout.module.css';

export default async function DirectorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'DIRECTOR') redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true },
  });

  return (
    <div className={styles.shell}>
      <NavbarDirector userName={user?.fullName || 'Director'} />
      <main className={styles.main}>
        <div className={styles.pageWrapper}>{children}</div>
      </main>
    </div>
  );
}
