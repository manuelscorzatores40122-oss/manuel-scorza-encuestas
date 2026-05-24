import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NavbarAuxiliar } from './NavbarAuxiliar';
import styles from './auxiliar-layout.module.css';

export default async function AuxiliarLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'AUXILIAR') redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true },
  });

  return (
    <div className={styles.shell}>
      <NavbarAuxiliar userName={user?.fullName || 'Auxiliar'} />
      <main className={styles.main}>
        <div className={styles.pageWrapper}>{children}</div>
      </main>
    </div>
  );
}
