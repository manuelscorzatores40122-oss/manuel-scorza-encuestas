'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  GraduationCap,
  ClipboardCheck,
  Bell,
  BarChart2,
  TrendingUp,
  Newspaper,
  LogOut,
  Brain,
} from 'lucide-react';
import { logoutAction } from '@/app/login/actions';
import styles from './psicologo-layout.module.css';

const NAV_ITEMS = [
  { href: '/psicologo',              label: 'Inicio',       icon: LayoutGrid     },
  { href: '/psicologo/estudiantes',  label: 'Estudiantes',  icon: GraduationCap  },
  { href: '/psicologo/encuestas',    label: 'Encuestas',    icon: ClipboardCheck },
  { href: '/psicologo/anuncios',     label: 'Anuncios',     icon: Newspaper      },
  { href: '/psicologo/respuestas',   label: 'Respuestas',   icon: BarChart2      },
  { href: '/psicologo/alertas',      label: 'Alertas',      icon: Bell           },
  { href: '/psicologo/estadisticas', label: 'Estadísticas', icon: TrendingUp     },
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
    if (href === '/psicologo') return pathname === '/psicologo';
    return pathname.startsWith(href);
  }

  return (
    <aside className={styles.sidebar}>

      {/* Cabecera */}
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarLogo}>
          <Brain className={styles.sidebarLogoIcon} />
        </div>
        <div className={styles.sidebarMeta}>
          <p className={styles.sidebarAppName}>Bienestar Escolar</p>
          <p className={styles.sidebarRole}>Psicólogo</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className={styles.sidebarNav}>
        <p className={styles.sidebarNavLabel}>Menú</p>
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
