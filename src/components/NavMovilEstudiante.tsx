// src/components/StudentMobileBottomNav.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home,
  ClipboardList,
  History,
  UserRound,
  Megaphone,
  Menu,
  LogOut,
} from 'lucide-react';

import { logoutAction } from '@/app/login/actions';
import styles from '@/app/estudiante/layout.module.css';

export function StudentMobileBottomNav({ pendingSurveys }: { pendingSurveys: number }) {
  const router = useRouter();

  async function logout() {
    await logoutAction();
    router.replace('/login');
  }

  return (
    <nav className={styles.mobileBottomNav}>
      <Link href="/estudiante" className={styles.mobileNavButton}>
        <Home className={styles.mobileIcon} />
        <span>Inicio</span>
      </Link>

      <Link href="/estudiante/encuestas" className={styles.mobileNavButton}>
        <span className={styles.mobileNavIconWrap}>
          <ClipboardList className={styles.mobileIcon} />
          {pendingSurveys > 0 && (
            <span className={styles.mobileBadge}>
              {pendingSurveys > 9 ? '9+' : pendingSurveys}
            </span>
          )}
        </span>
        <span>Encuestas</span>
      </Link>

      <Link href="/estudiante/anuncios" className={styles.mobileNavButton}>
        <Megaphone className={styles.mobileIcon} />
        <span>Anuncios</span>
      </Link>

      <details className={styles.mobileMenu}>
        <summary className={styles.mobileNavButton}>
          <Menu className={styles.mobileIcon} />
          <span>Más</span>
        </summary>

        <div className={styles.mobileMenuContent}>
          <Link href="/estudiante/historial" className={styles.mobileMenuItem}>
            <History className={styles.icon} />
            Mi historial
          </Link>

          <Link href="/estudiante/perfil" className={styles.mobileMenuItem}>
            <UserRound className={styles.icon} />
            Mi perfil
          </Link>

          <button
            type="button"
            onClick={logout}
            className={styles.mobileMenuItem}
          >
            <LogOut className={styles.icon} />
            Cerrar sesión
          </button>
        </div>
      </details>
    </nav>
  );
}
