'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Lock, LogIn, Shield,
  ClipboardCheck, Activity, Users, Clock3, BookOpen, ShieldCheck,
} from 'lucide-react';
import { loginAction } from './actions';
import styles from './login.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  /* scroll reveal */
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add(styles.visible), (i % 4) * 90);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    document.querySelectorAll(`.${styles.reveal}`).forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAction({ username: username.trim(), password });
      if (result.ok) {
        router.push(result.redirectTo);
      } else {
        setError(result.error ?? 'Error al iniciar sesión');
      }
    });
  }

  return (
    <div className={styles.page}>

      {/* ══ HEADER ══════════════════════════════════════ */}
      <header className={styles.header}>
        <div className={`${styles.wrap} ${styles.nav}`}>

          <a href="#" className={styles.brand}>
            <span className={styles.brandName}>Bienestar Escolar</span>
            <span className={styles.brandSub}>I.E. 40122 Manuel Scorza Torres</span>
          </a>

          <nav className={styles.navLinks}>
            <a href="#programa"   className={styles.navLink}>El programa</a>
            <a href="#como"       className={styles.navLink}>Cómo funciona</a>
            <a href="#privacidad" className={styles.navLink}>Privacidad</a>
          </nav>

          <a href="#acceder" className={styles.navCta}>
            Iniciar sesión
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>

        </div>
      </header>

      {/* ══ HERO + STATS ════════════════════════════════ */}
      <div className={styles.wrap}>

        <section className={`${styles.hero} ${styles.reveal}`} id="acceder">

          {/* Izquierda — copy */}
          <div className={styles.heroLeft}>
            <div className={styles.heroEyebrow}>Bienestar emocional estudiantil</div>

            <h1 className={styles.heroTitle}>
              Tu espacio para <em>cuidar</em> cómo te sientes
            </h1>

            <p className={styles.heroLead}>
              PsicoEscolar es la plataforma de acompañamiento psicológico de la I.E. 40122
              Manuel Scorza Torres. Realiza tus evaluaciones, registra cómo te sientes y
              conecta con el área de psicología, de forma segura y confidencial.
            </p>

            <div className={styles.heroActions}>
              <a href="#acceder" className={styles.btnSolid}>
                Ingresar con mi documento
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6"/>
                </svg>
              </a>
              <a href="#como" className={styles.btnText}>Conocer el programa</a>
            </div>

            <div className={styles.heroNote}>
              <Shield className={styles.heroNoteIcon} />
              Tus datos están protegidos y solo el área de psicología puede verlos.
            </div>
          </div>

          {/* Derecha — formulario */}
          <div className={styles.heroRight}>
            <div className={styles.loginBox}>

              <div className={styles.loginTop}>
                <div className={styles.loginKick}>Acceso</div>
                <h2 className={styles.loginTitle}>Iniciar sesión</h2>
                <p className={styles.loginSub}>Ingresa tus credenciales para continuar.</p>
              </div>

              <form onSubmit={submit} className={styles.loginForm}>
                <div className={styles.loginField}>
                  <label className={styles.loginLabel} htmlFor="username">Usuario</label>
                  <div className={styles.inputRow}>
                    <User className={styles.inputRowIcon} />
                    <input
                      id="username"
                      className={styles.input}
                      type="text"
                      placeholder="DNI / CE o correo institucional"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      required
                      autoFocus
                    />
                  </div>
                  <p className={styles.hint}>Estudiantes: tu DNI o CE · Personal: correo institucional.</p>
                </div>

                <div className={styles.loginField}>
                  <label className={styles.loginLabel} htmlFor="password">Contraseña</label>
                  <div className={styles.inputRow}>
                    <Lock className={styles.inputRowIcon} />
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

                <button type="submit" className={styles.submitBtn} disabled={pending}>
                  {pending ? 'Ingresando…' : 'Ingresar'}
                  <LogIn className={styles.submitBtnIcon} />
                </button>
              </form>

              <div className={styles.loginFoot}>
                <a href="/privacidad" className={styles.privacyLink}>Aviso de privacidad</a>
                <span className={styles.version}>PsicoEscolar v1.0</span>
              </div>

            </div>
          </div>

        </section>

        {/* Stats */}
        <div className={styles.stats}>
          {[
            { num: '100%', cap: 'Confidencial' },
            { num: '2',    cap: 'Niveles educativos' },
            { num: '24/7', cap: 'Acceso a la plataforma' },
            { num: '∞',   cap: 'Apoyo del equipo de psicología' },
          ].map((s) => (
            <div key={s.cap} className={`${styles.stat} ${styles.reveal}`}>
              <div className={styles.statNum}>{s.num}</div>
              <div className={styles.statCap}>{s.cap}</div>
            </div>
          ))}
        </div>

      </div>

      {/* ══ FEATURES ════════════════════════════════════ */}
      <section className={styles.block} id="programa">
        <div className={styles.wrap}>
          <div className={`${styles.secHead} ${styles.reveal}`}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              Qué encontrarás aquí
            </span>
            <h2 className={styles.secTitle}>Una herramienta hecha para acompañarte</h2>
            <p className={styles.secDesc}>
              Todo lo que necesitas para cuidar tu bienestar emocional durante tu vida escolar.
            </p>
          </div>

          <div className={styles.featGrid}>
            {[
              { Icon: ClipboardCheck, title: 'Encuestas y evaluaciones',    desc: 'Responde encuestas de bienestar y tests de forma sencilla desde tu celular o computadora, a tu propio ritmo.' },
              { Icon: Activity,       title: 'Registro de estado de ánimo', desc: 'Lleva un seguimiento de cómo te sientes a lo largo del tiempo y reconoce mejor tus emociones.' },
              { Icon: Users,          title: 'Acompañamiento cercano',      desc: 'El área de psicología revisa tus respuestas y puede contactarte cuando necesites apoyo u orientación.' },
              { Icon: Clock3,         title: 'A tu ritmo, cuando quieras',  desc: 'Accede en cualquier momento. No hay respuestas correctas ni incorrectas, solo las tuyas.' },
              { Icon: BookOpen,       title: 'Orientación vocacional',      desc: 'Descubre tus intereses y fortalezas con tests vocacionales que te ayudan a pensar en tu futuro.' },
              { Icon: ShieldCheck,    title: 'Privado y seguro',            desc: 'Tu información se trata con confidencialidad. Solo el personal autorizado de psicología tiene acceso.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className={`${styles.feat} ${styles.reveal}`}>
                <div className={styles.featIco}>
                  <Icon className={styles.featIcoIcon} />
                </div>
                <h3 className={styles.featTitle}>{title}</h3>
                <p  className={styles.featDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STEPS ═══════════════════════════════════════ */}
      <section className={styles.stepsSection} id="como">
        <div className={styles.wrap}>

          <div className={styles.stepsHead}>
            <div>
              <div className={styles.stepsLabel}>Cómo funciona</div>
              <h2 className={styles.stepsTitle}>Tres pasos<br/>para empezar</h2>
            </div>
            <p className={styles.stepsAside}>
              Un recorrido simple, pensado para que entres a tu espacio sin complicaciones.
            </p>
          </div>

          {[
            {
              n: '01', title: 'Ingresa con tu DNI',
              desc: <> Usa tu número de <b>DNI o CE</b> como usuario para acceder. El personal del colegio ingresa con su correo institucional.</>,
            },
            {
              n: '02', title: 'Completa tus actividades',
              desc: <> Responde las <b>encuestas y evaluaciones</b> que el área de psicología te asigne, con calma y honestidad. No hay respuestas correctas ni incorrectas.</>,
            },
            {
              n: '03', title: 'Recibe acompañamiento',
              desc: <> El <b>equipo de psicología</b> revisa tus respuestas y te orienta cuando lo necesites, de forma confidencial y cercana.</>,
            },
          ].map(({ n, title, desc }) => (
            <div key={n} className={styles.stepRow}>
              <div className={styles.stepIdx}>{n}</div>
              <div className={styles.stepTtl}>{title}</div>
              <p   className={styles.stepDesc}>{desc}</p>
            </div>
          ))}

        </div>
      </section>

      {/* ══ PRIVACY ═════════════════════════════════════ */}
      <section className={styles.privacySection} id="privacidad">
        <div className={styles.wrap}>

          <div className={`${styles.privacyHead} ${styles.reveal}`}>
            <div className={styles.privacyLabel}>Privacidad y confianza</div>
            <h2 className={styles.privacyTitle}>
              Un espacio seguro para <em>expresarte</em>
            </h2>
          </div>

          <div className={styles.privacyBody}>
            <div className={`${styles.privacyLede} ${styles.reveal}`}>
              Lo que compartes aquí se mantiene privado.{' '}
              <span className={styles.privacyQuiet}>
                Ninguno de tus compañeros puede ver tus respuestas, solo el equipo que te acompaña.
              </span>
            </div>

            <div className={`${styles.privacyGuarantees} ${styles.reveal}`}>
              {[
                { n: '01', title: 'Acceso restringido', desc: 'Solo el área de psicología autorizada del colegio puede ver tu información.' },
                { n: '02', title: 'Sin juicios',        desc: 'No hay respuestas buenas ni malas. Este es tu espacio para ser honesto contigo.' },
                { n: '03', title: 'Datos protegidos',   desc: 'Tu información se guarda de forma segura y se usa únicamente para acompañarte.' },
              ].map(({ n, title, desc }) => (
                <div key={n} className={styles.gItem}>
                  <div className={styles.gNum}>{n}</div>
                  <div>
                    <h4 className={styles.gItemTitle}>{title}</h4>
                    <p  className={styles.gItemDesc}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════ */}
      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footGrid}>

            <div>
              <div className={styles.footBrand}>
                Escolar<span className={styles.footBrandAccent}>Escolar</span>
              </div>
              <div className={styles.footBrandSub}>I.E. 40122 Manuel Scorza Torres</div>
              <p className={styles.footAbout}>
                Plataforma de acompañamiento psicológico y bienestar emocional para la comunidad
                estudiantil.
              </p>
            </div>

            <div>
              <h5 className={styles.footColTitle}>Navegación</h5>
              <a href="#programa"   className={styles.footLink}>El programa</a>
              <a href="#como"       className={styles.footLink}>Cómo funciona</a>
              <a href="#privacidad" className={styles.footLink}>Privacidad</a>
              <a href="#acceder"    className={styles.footLink}>Iniciar sesión</a>
            </div>

            <div>
              <h5 className={styles.footColTitle}>Recursos</h5>
              <a href="/privacidad" className={styles.footLink}>Aviso de privacidad</a>
              <a href="#"           className={styles.footLink}>Preguntas frecuentes</a>
              <a href="#"           className={styles.footLink}>Contactar a psicología</a>
            </div>

          </div>

          <div className={styles.footBottom}>
            <span>© 2026 I.E. 40122 Manuel Scorza Torres. Todos los derechos reservados.</span>
            <span>Bienestar Escolar 2026</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
