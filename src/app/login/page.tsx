'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, User, Lock, LogIn } from 'lucide-react';

import { loginAction } from './actions';
import styles from './login.module.css';

const ROLES = [
  { emoji: '🎓', label: 'Estudiantes' },
  { emoji: '🧠', label: 'Psicólogos'  },
  { emoji: '👨‍🏫', label: 'Tutores'     },
  { emoji: '🛡️', label: 'Directivos'  },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
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
    <div className={styles.page}>

      {/* ══ PANEL DERECHO — FORMULARIO ══ */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>

          <div className={styles.formCardTop} />

          {/* Icono + encabezado */}
          <div className={styles.formCardHead}>
  
            <div className={styles.formHeader}>
              <p className={styles.formWelcome}>Bienvenido</p>
              <h2 className={styles.formTitle}>Iniciar Sesión</h2>
              <p className={styles.formDesc}>Ingresa tus credenciales para continuar</p>
            </div>
          </div>

          {/* Campos */}
          <div className={styles.formCardBody}>
            <form onSubmit={submit} className={styles.formFields}>

              <div>
                <label className={styles.label} htmlFor="username">Usuario</label>
                <div className={styles.inputWrap}>
                  <User className={styles.inputIcon} />
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
                </div>
                <p className={styles.helpText}>
                  Estudiantes: ingresa tu DNI. Personal: tu correo institucional.
                </p>
              </div>

              <div>
                <label className={styles.label} htmlFor="password">Contraseña</label>
                <div className={styles.inputWrap}>
                  <Lock className={styles.inputIcon} />
                  <input
                    id="password"
                    className={styles.input}
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button type="submit" className={styles.button} disabled={pending}>
                <LogIn className={styles.buttonIcon} />
                {pending ? 'Ingresando...' : 'Ingresar'}
              </button>

            </form>

            <div className={styles.formFooter}>
              <a href="/privacidad" className={styles.privacyLink}>Aviso de privacidad</a>
              <p className={styles.formVersion}>PsicoEscolar v1.0 · 2026</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
