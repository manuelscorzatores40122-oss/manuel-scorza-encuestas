'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Bell, LogOut } from 'lucide-react';
import { logoutAction } from '@/app/login/actions';

import styles from '@/app/estudiante/layout.module.css';

export function AppBarEstudiante({ pendingSurveys }: { pendingSurveys: number }) {
  const router = useRouter();

  async function logout() {
    await logoutAction();
    router.replace('/login');
  }

  return (
    <header className={styles.mobileTopBar}>
      <Link href="/estudiante" className={styles.topBarBrand}>
        <Image
          src="/sss.png"
          alt="I.E. 40122 Manuel Scorza Torres"
          width={32}
          height={32}
          className={styles.topBarShield}
          priority
        />
        <span className={styles.topBarName}>PsicoEscolar</span>
      </Link>

      <div className={styles.topBarActions}>
        <Link
          href="/estudiante/encuestas"
          className={styles.topBarBell}
          aria-label="Encuestas pendientes"
        >
          <Bell className={styles.topBarBellIcon} />
          {pendingSurveys > 0 && <span className={styles.topBarBellDot} aria-hidden />}
        </Link>

        <button
          type="button"
          onClick={logout}
          className={styles.topBarLogoutBtn}
          aria-label="Cerrar sesión"
        >
          <LogOut className={styles.topBarBellIcon} />
        </button>
      </div>
    </header>
  );
}
