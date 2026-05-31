'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, ClipboardList, Megaphone,
  History, UserRound, LogOut, Brain,
} from 'lucide-react';
import { logoutAction } from '@/app/login/actions';
import styles from './layout.module.css';

type NavItem =
  | { type: 'link'; href: string; label: string; icon: React.ElementType; badgeKey?: string }
  | { type: 'divider' };

const NAV_ITEMS: NavItem[] = [
  { type: 'link', href: '/estudiante',           label: 'Inicio',       icon: Home },
  { type: 'link', href: '/estudiante/encuestas', label: 'Encuestas',    icon: ClipboardList, badgeKey: 'surveys' },
  { type: 'link', href: '/estudiante/anuncios',  label: 'Anuncios',     icon: Megaphone,     badgeKey: 'announcements' },
  { type: 'divider' },
  { type: 'link', href: '/estudiante/historial', label: 'Mi historial', icon: History },
  { type: 'link', href: '/estudiante/perfil',    label: 'Mi perfil',    icon: UserRound },
];

export function BarraLateral({
  pendingSurveys,
  announcementsCount,
}: {
  pendingSurveys:    number;
  announcementsCount: number;
}) {
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

  function badgeCount(key?: string) {
    if (key === 'surveys')       return pendingSurveys;
    if (key === 'announcements') return announcementsCount;
    return 0;
  }

  return (
    <aside className={styles.sidebar}>

      {/* Cabecera */}
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarLogo}>
          <Brain className={styles.sidebarLogoIcon} />
        </div>
        <div>
          <p className={styles.sidebarAppName}>PsicoEscolar</p>
          <p className={styles.sidebarRole}>Estudiante</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className={styles.sidebarNav}>
        {NAV_ITEMS.map((item, i) => {
          if (item.type === 'divider') {
            return <div key={`divider-${i}`} className={styles.navDivider} />;
          }
          const Icon  = item.icon;
          const count = badgeCount(item.badgeKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.sidebarItem} ${isActive(item.href) ? styles.sidebarItemActive : ''}`}
            >
              <Icon className={styles.sidebarItemIcon} />
              <span className={styles.sidebarItemLabel}>{item.label}</span>
              {count > 0 && (
                <span className={styles.navBadge}>
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>
          );
        })}
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
