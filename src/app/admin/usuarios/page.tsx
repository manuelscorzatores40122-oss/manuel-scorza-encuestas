import { prisma } from '@/lib/prisma';
import { ROLE_LABELS } from '@/lib/constants';
import { Users, Plus } from 'lucide-react';
import { TablaUsuarios } from './TablaUsuarios';

export default async function UsuariosPage({ searchParams }: { searchParams: { rol?: string; q?: string } }) {
  const q = searchParams.q?.trim() || '';
  const where: any = {};

  if (searchParams.rol) {
    where.role = searchParams.rol;
  } else if (!q) {
    // Sin búsqueda y sin rol: solo staff (los alumnos son cientos)
    where.role = { not: 'STUDENT' };
  }
  // Con búsqueda sin rol: busca en todos los roles, incluidos alumnos

  if (q) {
    where.fullName = { contains: q, mode: 'insensitive' };
  }

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

      <form className="card flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="label text-xs">Buscar por nombre</label>
          <input
            name="q"
            defaultValue={q}
            placeholder="Nombre o apellido (incluye alumnos)…"
            className="input"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="label text-xs">Filtrar por rol</label>
          <select name="rol" defaultValue={searchParams.rol || ''} className="input">
            <option value="">Solo staff</option>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button className="btn-primary" type="submit">Buscar</button>
      </form>

      <TablaUsuarios users={users.map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        email: u.email,
        isActive: u.isActive,
        lastLogin: u.lastLogin?.toISOString() || null,
      }))} />
    </div>
  );
}
