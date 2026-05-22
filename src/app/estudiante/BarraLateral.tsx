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
  { href: '/estudiante',           label: 'Inicio',      icon: Home          },
  { href: '/estudiante/encuestas', label: 'Encuestas',   icon: ClipboardList },
  { href: '/estudiante/anuncios',  label: 'Anuncios',    icon: Megaphone     },
  { href: '/estudiante/historial', label: 'Mi historial',icon: History       },
  { href: '/estudiante/perfil',    label: 'Mi perfil',   icon: UserRound     },
];

export function BarraLateral() {
  const pathname = usePathname();
  const router   = useRouter();

  async function logout() {
    await logoutAction();
    router.push('/login');
    router.refresh();
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
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.sidebarItem} ${isActive(href) ? styles.sidebarItemActive : ''}`}
          >
            <Icon className={styles.sidebarItemIcon} />
            <span>{label}</span>
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
