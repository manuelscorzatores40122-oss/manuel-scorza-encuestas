import { redirect } from 'next/navigation';
import { LayoutDashboard, Users, FileBarChart } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'TUTOR') redirect('/login');

  const nav = [
    { href: '/tutor', label: 'Inicio', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/tutor/estudiantes', label: 'Mi sección', icon: <Users className="w-4 h-4" /> },
    { href: '/tutor/respuestas', label: 'Respuestas', icon: <FileBarChart className="w-4 h-4" /> },
  ];

  return (
    <AppShell navItems={nav} user={{ fullName: session.fullName }} roleLabel="Tutor">
      {children}
    </AppShell>
  );
}
