'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, LogIn } from 'lucide-react';

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

      {/* ══ PANEL IZQUIERDO — PORTADA ══ */}
      <div className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroTopBar} />

        {/* Escudo / ícono */}
        <div className={styles.heroLogoWrap}>
          <span className={styles.heroLogoIcon}>🏫</span>
        </div>

        {/* Textos */}
        <div className={styles.heroContent}>
          <p className={styles.heroInstitution}>I.E. 40122 · Arequipa</p>

          <h1 className={styles.heroTitle}>
            Bienestar<br />Escolar
          </h1>

          <p className={styles.heroSub}>
            Manuel Scorza Torres
          </p>

          <div className={styles.heroDivider} />

        </div>

        <div className={styles.heroBadge}>
          ✦ Año Escolar 2025
        </div>
      </div>

      {/* ══ PANEL DERECHO — FORMULARIO ══ */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formCardTop} />

          <div className={styles.formCardBody}>
            {/* Encabezado */}
            <div className={styles.formHeader}>
              <p className={styles.formWelcome}>Bienvenido</p>
              <h2 className={styles.formTitle}>Iniciar Sesión</h2>
              <p className={styles.formDesc}>Ingresa tus credenciales para continuar</p>
            </div>

            {/* Formulario */}
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

              {/* Usuario */}
              <div>
                <label className={styles.label} htmlFor="username">
                  Usuario
                </label>
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

              {/* Contraseña */}
              <div>
                <label className={styles.label} htmlFor="password">
                  Contraseña
                </label>
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

              {/* Error */}
              {error && <div className={styles.error}>{error}</div>}

              {/* Botón */}
              <button
                type="submit"
                className={styles.button}
                disabled={pending}
              >
                <LogIn className={styles.buttonIcon} />
                {pending ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            {/* Footer */}
            <div className={styles.formFooter}>
              <a href="/privacidad" className={styles.privacyLink}>
                Aviso de privacidad
              </a>
              <p className={styles.formVersion}>PsicoEscolar v1.0 · 2025</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
