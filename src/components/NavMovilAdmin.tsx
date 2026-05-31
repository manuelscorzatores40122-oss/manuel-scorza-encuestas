'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid, Users, Megaphone, ShieldAlert,
  MoreHorizontal, X, Upload, FileText, LogOut,
} from 'lucide-react';
import { logoutAction } from '@/app/login/actions';
import styles from './NavMovilAdmin.module.css';

export function AdminMobileBottomNav() {
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
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  function btnCls(href: string) {
    return `${styles.btn} ${isActive(href) ? styles.btnActive : ''}`;
  }

  return (
    <nav className={styles.nav}>

      <Link href="/admin" className={btnCls('/admin')}>
        <span className={styles.iconWrap}><LayoutGrid className={styles.icon} /></span>
        <span>Inicio</span>
      </Link>

      <Link href="/admin/usuarios" className={btnCls('/admin/usuarios')}>
        <span className={styles.iconWrap}><Users className={styles.icon} /></span>
        <span>Usuarios</span>
      </Link>

      <Link href="/admin/anuncios" className={btnCls('/admin/anuncios')}>
        <span className={styles.iconWrap}><Megaphone className={styles.icon} /></span>
        <span>Anuncios</span>
      </Link>

      <Link href="/admin/reglas" className={btnCls('/admin/reglas')}>
        <span className={styles.iconWrap}><ShieldAlert className={styles.icon} /></span>
        <span>Reglas</span>
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
            <Link href="/admin/importar"  className={styles.moreItem} onClick={() => setOpen(false)}>
              <Upload className={styles.moreIcon} />Importar
            </Link>
            <Link href="/admin/auditoria" className={styles.moreItem} onClick={() => setOpen(false)}>
              <FileText className={styles.moreIcon} />Auditoría
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
