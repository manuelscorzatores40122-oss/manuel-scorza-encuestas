'use client';

import { useActionState } from 'react';
import { KeyRound, CheckCircle, User } from 'lucide-react';
import { changePasswordAction } from './actions';

const ROLE_LABELS: Record<string, string> = {
  PSYCHOLOGIST: 'Psicólogo/a',
  ADMIN: 'Administrador/a',
  DIRECTOR: 'Director/a',
  TUTOR: 'Tutor/a',
  AUXILIARY: 'Auxiliar',
  STUDENT: 'Estudiante',
};

type State = { ok: boolean; error?: string } | null;

export default function PerfilPage() {
  const [state, action, pending] = useActionState<State, FormData>(
    async (_prev: State, formData: FormData) => changePasswordAction(formData),
    null,
  );

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in py-8 px-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <User className="w-6 h-6 text-brand-600" /> Mi perfil
      </h1>

      <div className="card">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <KeyRound className="w-4 h-4 text-brand-600" /> Cambiar contraseña
        </h2>

        {state?.ok && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 mb-4 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Contraseña actualizada correctamente.
          </div>
        )}

        {state && !state.ok && state.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm font-medium">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label className="label" htmlFor="current">Contraseña actual</label>
            <input
              id="current"
              name="current"
              type="password"
              className="input"
              autoComplete="current-password"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="next">Nueva contraseña</label>
            <input
              id="next"
              name="next"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={6}
              required
            />
            <p className="text-xs text-slate-400 mt-1">Mínimo 6 caracteres.</p>
          </div>

          <div>
            <label className="label" htmlFor="confirm">Confirmar nueva contraseña</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              className="input"
              autoComplete="new-password"
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
