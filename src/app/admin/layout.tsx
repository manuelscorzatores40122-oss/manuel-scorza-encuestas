import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NavbarAdmin } from './NavbarAdmin';
import { AdminMobileBottomNav } from '@/components/NavMovilAdmin';
import styles from './admin-layout.module.css';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true },
  });

  const userName = user?.fullName || 'Administrador';

  return (
    <div className={styles.shell}>
      <NavbarAdmin userName={userName} />
      <main className={styles.main}>
        <div className={styles.pageWrapper}>{children}</div>
      </main>
      <AdminMobileBottomNav />
    </div>
  );
}
