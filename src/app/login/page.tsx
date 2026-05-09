'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, LogIn } from 'lucide-react';
import { loginAction } from './actions';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAction({ username: username.trim(), password });
      if (result.ok) {
        router.push(result.redirectTo);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-brand-50 via-white to-warm-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 text-white shadow-lg mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">PsicoEscolar</h1>
          <p className="text-slate-600 mt-2">I.E. 40122 Manuel Scorza Torres</p>
        </div>

        <form onSubmit={submit} className="card space-y-5 animate-fade-in">
          <div>
            <label className="label" htmlFor="username">Usuario</label>
            <input
              id="username"
              className="input"
              type="text"
              placeholder="DNI o correo institucional"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Estudiantes: ingresa tu DNI. Personal: tu correo institucional.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={pending}>
            <LogIn className="w-4 h-4" />
            {pending ? 'Ingresando...' : 'Ingresar'}
          </button>

          <div className="text-center">
            <a href="/privacidad" className="text-sm text-brand-600 hover:underline">
              Aviso de privacidad
            </a>
          </div>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Este sistema cumple con la Ley N° 29733 de Protección de Datos Personales.
        </p>
      </div>
    </div>
  );
}
