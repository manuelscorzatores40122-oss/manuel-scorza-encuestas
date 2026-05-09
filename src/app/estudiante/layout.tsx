import { redirect } from 'next/navigation';
import { Home, ClipboardList, History, UserRound, Megaphone } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') redirect('/login');

  const nav = [
    { href: '/estudiante', label: 'Inicio', icon: <Home className="w-4 h-4" /> },
    { href: '/estudiante/anuncios', label: 'Anuncios', icon: <Megaphone className="w-4 h-4" /> },
    { href: '/estudiante/encuestas', label: 'Mis encuestas', icon: <ClipboardList className="w-4 h-4" /> },
    { href: '/estudiante/historial', label: 'Mi historial', icon: <History className="w-4 h-4" /> },
    { href: '/estudiante/perfil', label: 'Mi perfil', icon: <UserRound className="w-4 h-4" /> },
  ];

  return (
    <AppShell
      navItems={nav}
      user={{ fullName: session.fullName }}
      roleLabel="Estudiante"
      themeColor="warm"
    >
      {children}
    </AppShell>
  );
}
