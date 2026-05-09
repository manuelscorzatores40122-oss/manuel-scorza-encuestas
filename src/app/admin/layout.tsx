import { redirect } from 'next/navigation';
import { LayoutDashboard, Upload, Users, ShieldAlert, FileText, Megaphone } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');

  const nav = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/admin/anuncios', label: 'Anuncios', icon: <Megaphone className="w-4 h-4" /> },
    { href: '/admin/importar', label: 'Importar SIAGIE', icon: <Upload className="w-4 h-4" /> },
    { href: '/admin/usuarios', label: 'Usuarios', icon: <Users className="w-4 h-4" /> },
    { href: '/admin/reglas', label: 'Reglas de alerta', icon: <ShieldAlert className="w-4 h-4" /> },
    { href: '/admin/auditoria', label: 'Auditoría', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <AppShell navItems={nav} user={{ fullName: session.fullName }} roleLabel="Administrador">
      {children}
    </AppShell>
  );
}
