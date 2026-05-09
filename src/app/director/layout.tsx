import { redirect } from 'next/navigation';
import { LayoutDashboard, BarChart3, FileText } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';

export default async function DirectorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'DIRECTOR') redirect('/login');

  const nav = [
    { href: '/director', label: 'Resumen', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/director/reportes', label: 'Reportes', icon: <BarChart3 className="w-4 h-4" /> },
    { href: '/director/comparativas', label: 'Comparativas', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <AppShell navItems={nav} user={{ fullName: session.fullName }} roleLabel="Director">
      {children}
    </AppShell>
  );
}
