import { redirect } from 'next/navigation';

import {
  Home,
  ClipboardList,
  History,
  UserRound,
  Megaphone,
} from 'lucide-react';

import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';
import { StudentMobileBottomNav } from '@/components/StudentMobileBottomNav';

import styles from './layout.module.css';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== 'STUDENT') {
    redirect('/login');
  }

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

      <StudentMobileBottomNav />
    </>
  );
}