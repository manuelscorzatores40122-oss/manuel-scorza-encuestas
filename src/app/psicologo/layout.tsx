import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { PsicologoMobileBottomNav } from '@/components/NavMovilPsicologo';
import { BarraLateral } from './BarraLateral';
import styles from './psicologo-layout.module.css';

export default async function PsicologoLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'PSYCHOLOGIST') redirect('/login');
  return (
    <div className={styles.shell}>
      <BarraLateral />
      <main className={styles.main}>
        <div className={styles.pageWrapper}>{children}</div>
      </main>
      <PsicologoMobileBottomNav />
    </div>
  );
}
