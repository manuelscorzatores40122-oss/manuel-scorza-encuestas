
// src/app/psicologo/layout.tsx

import { redirect } from 'next/navigation';

import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  Users,
  FileBarChart,
  Plus,
  Megaphone,
  BarChart3,
} from 'lucide-react';

import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';
import { PsicologoMobileBottomNav } from '@/components/PsicologoMobileBottomNav';

import styles from './psicologo-layout.module.css';

export default async function PsicologoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== 'PSYCHOLOGIST') {
    redirect('/login');
  }

  const nav = [
    {
      href: '/psicologo',
      label: 'Dashboard',
      icon: <LayoutDashboard className={styles.icon} />,
    },

    {
      href: '/psicologo/anuncios',
      label: 'Anuncios',
      icon: <Megaphone className={styles.icon} />,
    },

    {
      href: '/psicologo/encuestas',
      label: 'Encuestas',
      icon: <ClipboardList className={styles.icon} />,
    },

    {
      href: '/psicologo/encuestas/nueva',
      label: 'Nueva encuesta',
      icon: <Plus className={styles.icon} />,
    },

    {
      href: '/psicologo/respuestas',
      label: 'Respuestas',
      icon: <FileBarChart className={styles.icon} />,
    },

    {
      href: '/psicologo/estadisticas',
      label: 'Analítica',
      icon: <BarChart3 className={styles.icon} />,
    },

    {
      href: '/psicologo/alertas',
      label: 'Alertas',
      icon: <AlertTriangle className={styles.icon} />,
    },

    {
      href: '/psicologo/estudiantes',
      label: 'Estudiantes',
      icon: <Users className={styles.icon} />,
    },
  ];

  return (
    <>
      <AppShell
        navItems={nav}
        user={{
          fullName: session.fullName,
        }}
        roleLabel="Psicólogo"
      >
        <div className={styles.container}>
          {children}
        </div>
      </AppShell>

      <PsicologoMobileBottomNav />
    </>
  );
}
