
// src/components/PsicologoMobileBottomNav.tsx

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  Users,
  FileBarChart,
  Megaphone,
  Menu,
  BarChart3,
  LogOut,
  Plus,
} from 'lucide-react';

import { logoutAction } from '@/app/login/actions';

import styles from '@/app/estudiante/layout.module.css';

export function PsicologoMobileBottomNav() {
  const router = useRouter();

  async function logout() {
    await logoutAction();

    router.push('/login');
    router.refresh();
  }

  return (
    <nav className={styles.mobileBottomNav}>
      <Link
        href="/psicologo"
        className={styles.mobileNavButton}
      >
        <LayoutDashboard className={styles.mobileIcon} />
        <span>Inicio</span>
      </Link>

      <Link
        href="/psicologo/encuestas"
        className={styles.mobileNavButton}
      >
        <ClipboardList className={styles.mobileIcon} />
        <span>Encuestas</span>
      </Link>

      <Link
        href="/psicologo/alertas"
        className={styles.mobileNavButton}
      >
        <AlertTriangle className={styles.mobileIcon} />
        <span>Alertas</span>
      </Link>

      <details className={styles.mobileMenu}>
        <summary className={styles.mobileNavButton}>
          <Menu className={styles.mobileIcon} />
          <span>Más</span>
        </summary>

        <div className={styles.mobileMenuContent}>
          <Link
            href="/psicologo/anuncios"
            className={styles.mobileMenuItem}
          >
            <Megaphone className={styles.icon} />
            Anuncios
          </Link>

          <Link
            href="/psicologo/respuestas"
            className={styles.mobileMenuItem}
          >
            <FileBarChart className={styles.icon} />
            Respuestas
          </Link>

          <Link
            href="/psicologo/estadisticas"
            className={styles.mobileMenuItem}
          >
            <BarChart3 className={styles.icon} />
            Analítica
          </Link>

          <Link
            href="/psicologo/encuestas/nueva"
            className={styles.mobileMenuItem}
          >
            <Plus className={styles.icon} />
            Nueva encuesta
          </Link>

          <Link
            href="/psicologo/estudiantes"
            className={styles.mobileMenuItem}
          >
            <Users className={styles.icon} />
            Estudiantes
          </Link>

          <button
            type="button"
            onClick={logout}
            className={styles.mobileMenuItem}
          >
            <LogOut className={styles.icon} />
            Cerrar sesión
          </button>
        </div>
      </details>
    </nav>
  );
}

