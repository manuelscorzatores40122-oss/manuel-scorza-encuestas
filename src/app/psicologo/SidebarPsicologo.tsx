'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  AlertTriangle,
  FileBarChart,
  BarChart3,
  Megaphone,
  LogOut,
  Brain,
} from 'lucide-react';
import { logoutAction } from '@/app/login/actions';
import styles from './psicologo-layout.module.css';

const NAV_ITEMS = [
  { href: '/psicologo',             label: 'Inicio',       icon: LayoutDashboard },
  { href: '/psicologo/estudiantes', label: 'Estudiantes',  icon: Users           },
  { href: '/psicologo/encuestas',   label: 'Encuestas',    icon: ClipboardList   },
  { href: '/psicologo/alertas',     label: 'Alertas',      icon: AlertTriangle   },
  { href: '/psicologo/respuestas',  label: 'Respuestas',   icon: FileBarChart    },
  { href: '/psicologo/estadisticas',label: 'Estadísticas', icon: BarChart3       },
  { href: '/psicologo/anuncios',    label: 'Anuncios',     icon: Megaphone       },
];

export function SidebarPsicologo() {
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
        <div>
          <p className={styles.sidebarAppName}>PsicoEscolar</p>
          <p className={styles.sidebarRole}>Psicólogo</p>
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
