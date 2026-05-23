'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  GraduationCap,
  ClipboardCheck,
  Megaphone,
  MoreHorizontal,
  Bell,
  BarChart2,
  FileBarChart,
  LogOut,
} from 'lucide-react';
import { logoutAction } from '@/app/login/actions';
import styles from './NavMovilPsicologo.module.css';

export function PsicologoMobileBottomNav() {
  const pathname = usePathname();
  const router   = useRouter();

  async function logout() {
    await logoutAction();
    router.replace('/login');
  }

  function isActive(href: string) {
    if (href === '/psicologo') return pathname === '/psicologo';
    return pathname.startsWith(href);
  }

  function btnCls(href: string) {
    return `${styles.btn} ${isActive(href) ? styles.btnActive : ''}`;
  }

  return (
    <nav className={styles.nav}>

      {/* 1 — Alumnos */}
      <Link href="/psicologo/estudiantes" className={btnCls('/psicologo/estudiantes')}>
        <span className={styles.iconWrap}>
          <GraduationCap className={styles.icon} />
        </span>
        <span>Alumnos</span>
      </Link>

      {/* 2 — Encuestas */}
      <Link href="/psicologo/encuestas" className={btnCls('/psicologo/encuestas')}>
        <span className={styles.iconWrap}>
          <ClipboardCheck className={styles.icon} />
        </span>
        <span>Encuestas</span>
      </Link>

      {/* 3 — Inicio */}
      <Link href="/psicologo" className={btnCls('/psicologo')}>
        <span className={styles.iconWrap}>
          <LayoutGrid className={styles.icon} />
        </span>
        <span>Inicio</span>
      </Link>

      {/* 4 — Anuncios */}
      <Link href="/psicologo/anuncios" className={btnCls('/psicologo/anuncios')}>
        <span className={styles.iconWrap}>
          <Megaphone className={styles.icon} />
        </span>
        <span>Anuncios</span>
      </Link>

      {/* 5 — Más */}
      <details className={styles.more}>
        <summary className={styles.btn}>
          <span className={styles.iconWrap}>
            <MoreHorizontal className={styles.icon} />
          </span>
          <span>Más</span>
        </summary>

        <div className={styles.morePanel}>
          <Link href="/psicologo/alertas" className={styles.moreItem}>
            <Bell className={styles.moreIcon} />
            Alertas
          </Link>
          <Link href="/psicologo/respuestas" className={styles.moreItem}>
            <FileBarChart className={styles.moreIcon} />
            Respuestas
          </Link>
          <Link href="/psicologo/estadisticas" className={styles.moreItem}>
            <BarChart2 className={styles.moreIcon} />
            Estadísticas
          </Link>
          <button type="button" onClick={logout} className={styles.moreItemLogout}>
            <LogOut className={styles.moreIcon} />
            Cerrar sesión
          </button>
        </div>
      </details>

    </nav>
  );
}
