import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { PsicologoMobileBottomNav } from '@/components/NavMovilPsicologo';
import { SidebarPsicologo } from './SidebarPsicologo';
import styles from './psicologo-layout.module.css';

export default async function PsicologoLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'PSYCHOLOGIST') redirect('/login');
  return (
    <div className={styles.shell}>
      <SidebarPsicologo />
      <main className={styles.main}>
        <div className={styles.pageWrapper}>{children}</div>
      </main>
      <PsicologoMobileBottomNav />
    </div>
  );
}
