'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  ClipboardList,
  Megaphone,
  History,
  UserRound,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import { logoutAction } from '@/app/login/actions';
import styles from './layout.module.css';

const NAV_ITEMS = [
  { href: '/estudiante',           label: 'Inicio',       icon: Home,          badge: false },
  { href: '/estudiante/encuestas', label: 'Encuestas',    icon: ClipboardList, badge: true  },
  { href: '/estudiante/anuncios',  label: 'Anuncios',     icon: Megaphone,     badge: false },
  { href: '/estudiante/historial', label: 'Mi historial', icon: History,       badge: false },
  { href: '/estudiante/perfil',    label: 'Mi perfil',    icon: UserRound,     badge: false },
];

export function BarraLateral({ pendingSurveys }: { pendingSurveys: number }) {
  const pathname = usePathname();
  const router   = useRouter();

  async function logout() {
    await logoutAction();
    router.replace('/login');
  }

  function isActive(href: string) {
    if (href === '/estudiante') return pathname === '/estudiante';
    return pathname.startsWith(href);
  }

  return (
    <aside className={styles.sidebar}>

      {/* Cabecera */}
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarLogo}>
          <GraduationCap className={styles.sidebarLogoIcon} />
        </div>
        <div>
          <p className={styles.sidebarAppName}>PsicoEscolar</p>
          <p className={styles.sidebarRole}>Estudiante</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className={styles.sidebarNav}>
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.sidebarItem} ${isActive(href) ? styles.sidebarItemActive : ''}`}
          >
            <Icon className={styles.sidebarItemIcon} />
            <span className={styles.sidebarItemLabel}>{label}</span>
            {badge && pendingSurveys > 0 && (
              <span className={styles.navBadge}>
                {pendingSurveys > 9 ? '9+' : pendingSurveys}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Cerrar sesión */}
      <div className={styles.sidebarFooter}>
        <button type="button" onClick={logout} className={styles.sidebarLogout}>
          <LogOut className={styles.sidebarItemIcon} />
          <span>Cerrar sesión</span>
        </button>
      </div>

    </aside>
  );
}
