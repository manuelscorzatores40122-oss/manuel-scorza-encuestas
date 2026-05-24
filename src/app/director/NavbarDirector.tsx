'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, BarChart2, FileText, Users, Megaphone, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { logoutAction } from '@/app/login/actions';
import styles from './NavbarDirector.module.css';

const NAV_ITEMS = [
  { href: '/director',               label: 'Inicio',       icon: LayoutGrid },
  { href: '/director/comparativas',  label: 'Comparativas', icon: BarChart2  },
  { href: '/director/reportes',      label: 'Reportes',     icon: FileText   },
  { href: '/director/estudiantes',   label: 'Estudiantes',  icon: Users      },
  { href: '/director/anuncios',      label: 'Anuncios',     icon: Megaphone  },
];

interface Props { userName: string }

export function NavbarDirector({ userName }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await logoutAction();
    router.replace('/login');
  }

  function isActive(href: string) {
    if (href === '/director') return pathname === '/director';
    return pathname.startsWith(href);
  }

  const initials = userName
    .split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || 'DR';

  return (
    <header className={styles.header}>

      {/* ── Fila 1: marca ── */}
      <div className={styles.brandRow}>
        <div className={styles.brandLeft}>
          <span className={styles.appName}>PsicoEscolar</span>
          <span className={styles.roleChip}>Panel · Director</span>
        </div>

        <div className={styles.accountRight}>
          <span className={styles.areaName}>Dirección</span>
          <div className={styles.avatar} title={userName}>{initials}</div>
          <button
            className={styles.hamburger}
            onClick={() => setOpen(v => !v)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
          >
            {open ? <X className={styles.hamburgerIcon} /> : <Menu className={styles.hamburgerIcon} />}
          </button>
        </div>
      </div>

      {/* ── Fila 2: pestañas (escritorio) ── */}
      <nav className={styles.tabsRow} aria-label="Navegación principal">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.tab} ${isActive(href) ? styles.tabActive : ''}`}
          >
            <Icon className={styles.tabIcon} />
            <span>{label}</span>
          </Link>
        ))}
        <button type="button" onClick={logout} className={styles.tabLogout}>
          <LogOut className={styles.tabIcon} />
          <span>Salir</span>
        </button>
      </nav>

      {/* ── Cajón móvil ── */}
      {open && (
        <nav className={styles.drawer} aria-label="Menú móvil">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.drawerItem} ${isActive(href) ? styles.drawerItemActive : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon className={styles.drawerIcon} />
              <span className={styles.drawerLabel}>{label}</span>
            </Link>
          ))}
          <button type="button" onClick={logout} className={styles.drawerLogout}>
            <LogOut className={styles.drawerIcon} />
            <span>Cerrar sesión</span>
          </button>
        </nav>
      )}

    </header>
  );
}
