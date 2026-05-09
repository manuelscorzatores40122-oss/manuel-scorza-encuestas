import { redirect } from 'next/navigation';
import { LayoutDashboard, Users, FileBarChart } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';

export default async function AuxiliarLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'AUXILIAR') redirect('/login');

  const nav = [
    { href: '/auxiliar', label: 'Inicio', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/auxiliar/estudiantes', label: 'Estudiantes', icon: <Users className="w-4 h-4" /> },
    { href: '/auxiliar/respuestas', label: 'Respuestas', icon: <FileBarChart className="w-4 h-4" /> },
  ];

  return (
    <AppShell navItems={nav} user={{ fullName: session.fullName }} roleLabel="Auxiliar">
      {children}
    </AppShell>
  );
}
