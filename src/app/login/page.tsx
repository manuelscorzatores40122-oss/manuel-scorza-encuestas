'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, LogIn } from 'lucide-react';

import { loginAction } from './actions';

import styles from './login.module.css';

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
      const result = await loginAction({
        username: username.trim(),
        password,
      });

      if (result.ok) {
        router.push(result.redirectTo);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.cardWrapper}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
          </div>

          <h1 className={styles.title}>
            Bienestar Escolar
          </h1>

          <p className={styles.subtitle}>
            I.E. 40122 Manuel Scorza Torres
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={submit}
          className={styles.form}
        >

          {/* Usuario */}
          <div>
            <label
              className={styles.label}
              htmlFor="username"
            >
              Usuario
            </label>

            <input
              id="username"
              className={styles.input}
              type="text"
              placeholder="DNI o correo institucional"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              autoFocus
            />

            <p className={styles.helpText}>
              Estudiantes: ingresa tu DNI. Personal: tu correo institucional.
            </p>
          </div>

          {/* Contraseña */}
          <div>
            <label
              className={styles.label}
              htmlFor="password"
            >
              Contraseña
            </label>

            <input
              id="password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            className={styles.button}
            disabled={pending}
          >
            <LogIn className={styles.buttonIcon} />

            {pending
              ? 'Ingresando...'
              : 'Ingresar'}
          </button>

          {/* Privacidad */}
          <div className={styles.footer}>
            <a
              href="/privacidad"
              className={styles.privacyLink}
            >
              Aviso de privacidad
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}