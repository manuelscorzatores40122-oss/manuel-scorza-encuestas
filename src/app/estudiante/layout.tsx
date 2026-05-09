import { redirect } from 'next/navigation';
import Link from 'next/link';

import {
  Home,
  ClipboardList,
  History,
  UserRound,
  Megaphone,
  Menu,
} from 'lucide-react';

import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';

import styles from './layout.module.css';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // Obtener sesión
  const session = await getSession();

  // Validar estudiante autenticado
  if (!session || session.role !== 'STUDENT') {
    redirect('/login');
  }

  // Navegación escritorio
  const nav = [
    {
      href: '/estudiante',
      label: 'Inicio',
      icon: <Home className={styles.icon} />,
    },

    {
      href: '/estudiante/anuncios',
      label: 'Anuncios',
      icon: <Megaphone className={styles.icon} />,
    },

    {
      href: '/estudiante/encuestas',
      label: 'Mis encuestas',
      icon: <ClipboardList className={styles.icon} />,
    },

    {
      href: '/estudiante/historial',
      label: 'Mi historial',
      icon: <History className={styles.icon} />,
    },

    {
      href: '/estudiante/perfil',
      label: 'Mi perfil',
      icon: <UserRound className={styles.icon} />,
    },
  ];

  return (
    <>

      {/* Layout principal */}
      <AppShell
        navItems={nav}

        user={{
          fullName: session.fullName,
        }}

        roleLabel="Estudiante"

        themeColor="warm"
      >
        <div className={styles.mobileSafeArea}>
          {children}
        </div>
      </AppShell>

      {/* Navegación móvil */}
      <nav className={styles.mobileBottomNav}>

        {/* Inicio */}
        <Link
          href="/estudiante"
          className={styles.mobileNavButton}
        >
          <Home className={styles.mobileIcon} />
          <span>Inicio</span>
        </Link>

        {/* Encuestas */}
        <Link
          href="/estudiante/encuestas"
          className={styles.mobileNavButton}
        >
          <ClipboardList className={styles.mobileIcon} />
          <span>Encuestas</span>
        </Link>

        {/* Anuncios */}
        <Link
          href="/estudiante/anuncios"
          className={styles.mobileNavButton}
        >
          <Megaphone className={styles.mobileIcon} />
          <span>Anuncios</span>
        </Link>

        {/* Más */}
        <details className={styles.mobileMenu}>

          <summary className={styles.mobileNavButton}>
            <Menu className={styles.mobileIcon} />
            <span>Más</span>
          </summary>

          <div className={styles.mobileMenuContent}>

            {/* Historial */}
            <Link
              href="/estudiante/historial"
              className={styles.mobileMenuItem}
            >
              <History className={styles.icon} />
              Mi historial
            </Link>

            {/* Perfil */}
            <Link
              href="/estudiante/perfil"
              className={styles.mobileMenuItem}
            >
              <UserRound className={styles.icon} />
              Mi perfil
            </Link>

          </div>
        </details>

      </nav>
    </>
  );
}