import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { StudentMobileBottomNav } from '@/components/NavMovilEstudiante';
import { BarraLateral } from './BarraLateral';
import styles from './layout.module.css';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') redirect('/login');

  return (
    <div className={styles.shell}>
      <BarraLateral />
      <main className={styles.main}>
        <div className={styles.pageWrapper}>{children}</div>
      </main>
      <StudentMobileBottomNav />
    </div>
  );
}
