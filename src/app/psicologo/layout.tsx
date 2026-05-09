import { redirect } from 'next/navigation';
import { LayoutDashboard, ClipboardList, AlertTriangle, Users, FileBarChart, Plus, Megaphone } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';

export default async function PsicologoLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'PSYCHOLOGIST') redirect('/login');

  const nav = [
    { href: '/psicologo', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/psicologo/anuncios', label: 'Anuncios', icon: <Megaphone className="w-4 h-4" /> },
    { href: '/psicologo/encuestas', label: 'Encuestas', icon: <ClipboardList className="w-4 h-4" /> },
    { href: '/psicologo/encuestas/nueva', label: 'Nueva encuesta', icon: <Plus className="w-4 h-4" /> },
    { href: '/psicologo/respuestas', label: 'Respuestas', icon: <FileBarChart className="w-4 h-4" /> },
    { href: '/psicologo/alertas', label: 'Alertas', icon: <AlertTriangle className="w-4 h-4" /> },
    { href: '/psicologo/estudiantes', label: 'Estudiantes', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <AppShell navItems={nav} user={{ fullName: session.fullName }} roleLabel="Psicólogo">
      {children}
    </AppShell>
  );
}
