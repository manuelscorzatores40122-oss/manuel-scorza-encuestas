'use client';

import { useState, useTransition } from 'react';
import { Plus, KeyRound, UserX } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/constants';
import { createUserAction, resetPasswordAction, deactivateUserAction } from './actions';
import { useRouter } from 'next/navigation';

type U = { id: string; username: string; fullName: string; role: string; email: string | null; lastLogin: string | null };

export function TablaUsuarios({ users }: { users: U[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function newUser(formData: FormData) {
    startTransition(async () => {
      const r = await createUserAction(formData);
      if (r.ok) {
        setMsg(`Usuario creado. Clave temporal: ${r.tempPassword}`);
        setShowNew(false);
        router.refresh();
      } else setMsg(`Error: ${r.error}`);
    });
  }

  function reset(id: string) {
    if (!confirm('¿Generar nueva clave para este usuario?')) return;
    startTransition(async () => {
      const r = await resetPasswordAction(id);
      if (r.ok) setMsg(`Nueva clave: ${r.tempPassword}`);
      else setMsg(`Error: ${r.error}`);
    });
  }

  function deactivate(id: string) {
    if (!confirm('¿Desactivar este usuario? Ya no podrá iniciar sesión.')) return;
    startTransition(async () => {
      await deactivateUserAction(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setShowNew(!showNew)} className="btn-primary">
        <Plus className="w-4 h-4" /> Nuevo usuario
      </button>

      {msg && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm">
          {msg} <button onClick={() => setMsg(null)} className="ml-2 text-xs underline">cerrar</button>
        </div>
      )}

      {showNew && (
        <form action={newUser} className="card grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Nombre completo</label>
            <input name="fullName" required className="input" />
          </div>
          <div>
            <label className="label">Correo / usuario</label>
            <input name="username" required className="input" placeholder="usuario@scorzatorres.edu.pe" />
          </div>
          <div>
            <label className="label">Rol</label>
            <select name="role" required className="input">
              {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'STUDENT').map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowNew(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={pending} className="btn-primary">{pending ? 'Creando...' : 'Crear'}</button>
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Usuario</th>
              <th className="text-left px-4 py-3">Rol</th>
              <th className="text-left px-4 py-3">Último acceso</th>
              <th className="text-right px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{u.fullName}</td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{u.username}</td>
                <td className="px-4 py-3"><span className="badge bg-slate-100 text-slate-700">{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS]}</span></td>
                <td className="px-4 py-3 text-xs text-slate-500" suppressHydrationWarning>
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleString('es-PE') : 'Nunca'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => reset(u.id)} className="text-brand-600 text-xs hover:underline mr-3" disabled={pending}>
                    <KeyRound className="w-3 h-3 inline" /> Resetear clave
                  </button>
                  <button onClick={() => deactivate(u.id)} className="text-red-600 text-xs hover:underline" disabled={pending}>
                    <UserX className="w-3 h-3 inline" /> Desactivar
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">No hay usuarios.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
