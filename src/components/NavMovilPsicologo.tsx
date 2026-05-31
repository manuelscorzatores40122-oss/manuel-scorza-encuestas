'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid, GraduationCap, ClipboardCheck, Megaphone,
  MoreHorizontal, X, Bell, BarChart2, FileBarChart, LogOut,
} from 'lucide-react';
import { logoutAction } from '@/app/login/actions';
import styles from './NavMovilPsicologo.module.css';

export function PsicologoMobileBottomNav() {
  const pathname          = usePathname();
  const router            = useRouter();
  const [open, setOpen]   = useState(false);
  const menuRef           = useRef<HTMLDivElement>(null);

  /* Cerrar al tocar fuera */
  useEffect(() => {
    if (!open) return;
    function outside(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown',  outside);
    document.addEventListener('touchstart', outside);
    return () => {
      document.removeEventListener('mousedown',  outside);
      document.removeEventListener('touchstart', outside);
    };
  }, [open]);

  async function logout() {
    setOpen(false);
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

      <Link href="/psicologo/estudiantes" className={btnCls('/psicologo/estudiantes')}>
        <span className={styles.iconWrap}><GraduationCap className={styles.icon} /></span>
        <span>Alumnos</span>
      </Link>

      <Link href="/psicologo/encuestas" className={btnCls('/psicologo/encuestas')}>
        <span className={styles.iconWrap}><ClipboardCheck className={styles.icon} /></span>
        <span>Encuestas</span>
      </Link>

      <Link href="/psicologo" className={btnCls('/psicologo')}>
        <span className={styles.iconWrap}><LayoutGrid className={styles.icon} /></span>
        <span>Inicio</span>
      </Link>

      <Link href="/psicologo/anuncios" className={btnCls('/psicologo/anuncios')}>
        <span className={styles.iconWrap}><Megaphone className={styles.icon} /></span>
        <span>Anuncios</span>
      </Link>

      {/* Más — menú controlado */}
      <div ref={menuRef} className={styles.moreWrap}>
        <button
          type="button"
          className={`${styles.btn} ${open ? styles.btnActive : ''}`}
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
        >
          <span className={styles.iconWrap}>
            {open ? <X className={styles.icon} /> : <MoreHorizontal className={styles.icon} />}
          </span>
          <span>Más</span>
        </button>

        {open && (
          <div className={styles.morePanel}>
            <Link href="/psicologo/alertas"      className={styles.moreItem} onClick={() => setOpen(false)}>
              <Bell className={styles.moreIcon} />Alertas
            </Link>
            <Link href="/psicologo/respuestas"   className={styles.moreItem} onClick={() => setOpen(false)}>
              <FileBarChart className={styles.moreIcon} />Respuestas
            </Link>
            <Link href="/psicologo/estadisticas" className={styles.moreItem} onClick={() => setOpen(false)}>
              <BarChart2 className={styles.moreIcon} />Estadísticas
            </Link>
            <button type="button" onClick={logout} className={styles.moreItemLogout}>
              <LogOut className={styles.moreIcon} />Cerrar sesión
            </button>
          </div>
        )}
      </div>

    </nav>
  );
}
