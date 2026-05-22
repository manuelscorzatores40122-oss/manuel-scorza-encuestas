import { prisma } from '@/lib/prisma';
import { ROLE_LABELS } from '@/lib/constants';
import { Users, Plus } from 'lucide-react';
import { TablaUsuarios } from './TablaUsuarios';

export default async function UsuariosPage({ searchParams }: { searchParams: { rol?: string } }) {
  const where: any = { isActive: true };
  if (searchParams.rol) where.role = searchParams.rol;
  // Por defecto NO mostramos estudiantes (son cientos), solo staff
  if (!searchParams.rol) where.role = { not: 'STUDENT' };

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    take: 500,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-600" /> Usuarios
        </h1>
      </div>

      <form className="card flex gap-3 items-end">
        <div>
          <label className="label text-xs">Filtrar por rol</label>
          <select name="rol" defaultValue={searchParams.rol || ''} className="input">
            <option value="">Solo staff</option>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button className="btn-primary" type="submit">Filtrar</button>
      </form>

      <TablaUsuarios users={users.map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        email: u.email,
        lastLogin: u.lastLogin?.toISOString() || null,
      }))} />
    </div>
  );
}
