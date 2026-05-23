'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  GraduationCap,
  ClipboardCheck,
  Megaphone,
  BarChart2,
  Bell,
  TrendingUp,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { logoutAction } from '@/app/login/actions';
import styles from './NavbarPsicologo.module.css';

const NAV_ITEMS = [
  { href: '/psicologo',              label: 'Inicio',       icon: LayoutGrid,    badge: false },
  { href: '/psicologo/estudiantes',  label: 'Estudiantes',  icon: GraduationCap, badge: false },
  { href: '/psicologo/encuestas',    label: 'Encuestas',    icon: ClipboardCheck,badge: false },
  { href: '/psicologo/anuncios',     label: 'Anuncios',     icon: Megaphone,     badge: false },
  { href: '/psicologo/respuestas',   label: 'Respuestas',   icon: BarChart2,     badge: false },
  { href: '/psicologo/alertas',      label: 'Alertas',      icon: Bell,          badge: true  },
  { href: '/psicologo/estadisticas', label: 'Estadísticas', icon: TrendingUp,    badge: false },
];

interface Props {
  userName: string;
  alertCount: number;
}

export function NavbarPsicologo({ userName, alertCount }: Props) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await logoutAction();
    router.replace('/login');
  }

  function isActive(href: string) {
    if (href === '/psicologo') return pathname === '/psicologo';
    return pathname.startsWith(href);
  }

  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase() || 'PS';

  const badgeLabel = alertCount > 9 ? '9+' : String(alertCount);

  return (
    <header className={styles.header}>

      {/* ══ FILA 1: marca + cuenta ══════════════════════ */}
      <div className={styles.brandRow}>

        <div className={styles.brandLeft}>
          <span className={styles.appName}>PsicoEscolar</span>
          <span className={styles.roleChip}>Panel · Psicólogo</span>
        </div>

        <div className={styles.accountRight}>
          {/* Campana con badge */}
          <Link href="/psicologo/alertas" className={styles.bellBtn} aria-label="Alertas pendientes">
            <Bell className={styles.bellIcon} />
            {alertCount > 0 && <span className={styles.bellBadge}>{badgeLabel}</span>}
          </Link>

          {/* Nombre del área — se oculta en móvil */}
          <span className={styles.areaName}>Área de Psicología</span>

          {/* Avatar */}
          <div className={styles.avatar} title={userName}>{initials}</div>

          {/* Hamburguesa — solo móvil */}
          <button
            className={styles.hamburger}
            onClick={() => setOpen(v => !v)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
          >
            {open
              ? <X   className={styles.hamburgerIcon} />
              : <Menu className={styles.hamburgerIcon} />}
          </button>
        </div>
      </div>

      {/* ══ FILA 2: pestañas (solo escritorio) ══════════ */}
      <nav className={styles.tabsRow} aria-label="Navegación principal">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.tab} ${isActive(href) ? styles.tabActive : ''}`}
          >
            <span className={styles.tabIconWrap}>
              <Icon className={styles.tabIcon} />
              {badge && alertCount > 0 && (
                <span className={styles.tabBadge}>{badgeLabel}</span>
              )}
            </span>
            <span>{label}</span>
          </Link>
        ))}

        <button type="button" onClick={logout} className={styles.tabLogout}>
          <LogOut className={styles.tabIcon} />
          <span>Salir</span>
        </button>
      </nav>

      {/* ══ CAJÓN MÓVIL ══════════════════════════════════ */}
      {open && (
        <nav className={styles.drawer} aria-label="Menú móvil">
          {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.drawerItem} ${isActive(href) ? styles.drawerItemActive : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon className={styles.drawerIcon} />
              <span className={styles.drawerLabel}>{label}</span>
              {badge && alertCount > 0 && (
                <span className={styles.drawerBadge}>{badgeLabel}</span>
              )}
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
