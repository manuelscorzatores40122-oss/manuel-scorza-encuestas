'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Lock, LogIn, Shield, CheckCircle2, Clock3,
  ClipboardCheck, Activity, Users, BookOpen, ShieldCheck,
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
        <div className={styles.wrap}>
          <div className={styles.nav}>
            <a href="#" className={styles.brand}>
              <div className={styles.brandMark}>
                <svg className={styles.brandMarkIcon} viewBox="0 0 24 24" fill="none">
                  <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" fill="#fff"/>
                </svg>
              </div>
              <div>
                <span className={styles.brandName}>
                  Psico<span className={styles.brandNameAccent}>Escolar</span>
                </span>
                <span className={styles.brandSub}>I.E. 40122 Manuel Scorza</span>
              </div>
            </a>

            <nav className={styles.navLinks}>
              <a href="#programa"    className={styles.navLink}>El programa</a>
              <a href="#como"        className={styles.navLink}>Cómo funciona</a>
              <a href="#privacidad"  className={styles.navLink}>Privacidad</a>
              <a href="#acceder" className={`${styles.btn} ${styles.btnPrimary}`}>
                Iniciar sesión
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* ══ HERO ════════════════════════════════════════ */}
      <section className={styles.hero}>
        <div className={`${styles.wrap} ${styles.heroGrid}`}>

          {/* Left — copy */}
          <div className={`${styles.heroCopy} ${styles.reveal}`}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              Bienestar emocional estudiantil
            </span>

            <h1 className={styles.heroTitle}>
              Tu espacio para <em>cuidar</em> cómo te sientes
            </h1>

            <p className={styles.heroLead}>
              PsicoEscolar es la plataforma de acompañamiento psicológico de la I.E. 40122 Manuel Scorza Torres.
              Realiza tus evaluaciones, registra cómo te sientes y conecta con el área de psicología,
              de forma segura y confidencial.
            </p>

            <div className={styles.heroActions}>
              <a href="#acceder" className={`${styles.btn} ${styles.btnPrimary}`}>
                Ingresar con mi DNI
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
              <a href="#como" className={`${styles.btn} ${styles.btnGhost}`}>Conocer más</a>
            </div>

            <div className={styles.heroNote}>
              <Shield className={styles.heroNoteIcon} />
              Tus datos están protegidos y solo el área de psicología puede verlos.
            </div>
          </div>

          {/* Right — login form */}
          <div className={`${styles.heroVisual} ${styles.reveal}`} id="acceder">

            {/* floating badge top-right */}
            <div className={`${styles.floatBadge} ${styles.fb1}`}>
              <div className={`${styles.floatIco} ${styles.floatIco1}`}>
                <CheckCircle2 className={styles.floatIcoIcon} />
              </div>
              <div>
                <div className={styles.floatT}>Evaluación</div>
                <div className={styles.floatN}>Lista</div>
              </div>
            </div>

            {/* form card */}
            <div className={styles.formCard}>
              <div className={styles.formStripe} />
              <div className={styles.formBody}>

                <div className={styles.formHead}>
                  <p className={styles.formPreTitle}>Bienvenido</p>
                  <h2 className={styles.formMainTitle}>Iniciar sesión</h2>
                  <p className={styles.formSubTitle}>Ingresa tus credenciales para continuar</p>
                </div>

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
                      Estudiantes: DNI · Personal: correo institucional
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

                  <button type="submit" className={styles.submitBtn} disabled={pending}>
                    <LogIn className={styles.submitBtnIcon} />
                    {pending ? 'Ingresando...' : 'Ingresar'}
                  </button>
                </form>

                <div className={styles.formFooterNote}>
                  <a href="/privacidad" className={styles.privacyLink}>Aviso de privacidad</a>
                  <span className={styles.version}>PsicoEscolar v1.0 · 2026</span>
                </div>

              </div>
            </div>

            {/* floating badge bottom-left */}
            <div className={`${styles.floatBadge} ${styles.fb2}`}>
              <div className={`${styles.floatIco} ${styles.floatIco2}`}>
                <svg className={styles.floatIcoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div>
                <div className={styles.floatT}>Psicología</div>
                <div className={styles.floatN}>Disponible</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ TRUST STRIP ═════════════════════════════════ */}
      <div className={styles.strip}>
        <div className={styles.wrap}>
          <div className={styles.stripInner}>
            {[
              { num: '100%', cap: 'Confidencial' },
              { num: '3',    cap: 'Niveles educativos' },
              { num: '24/7', cap: 'Acceso a la plataforma' },
              { num: '1',    cap: 'Equipo de psicología que te acompaña' },
            ].map((s) => (
              <div key={s.cap} className={`${styles.stat} ${styles.reveal}`}>
                <div className={styles.statNum}>{s.num}</div>
                <div className={styles.statCap}>{s.cap}</div>
              </div>
            ))}
          </div>
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
      <section className={styles.block} id="como" style={{ paddingTop: 0 }}>
        <div className={styles.wrap}>
          <div className={`${styles.stepsWrap} ${styles.reveal}`}>
            <div className={styles.stepsHead}>
              <h2 className={styles.stepsTitle}>Empezar es muy fácil</h2>
              <p className={styles.stepsSubtitle}>En tres pasos ya estarás dentro de tu espacio.</p>
            </div>
            <div className={styles.stepsGrid}>
              {[
                { n: '01', title: 'Ingresa con tu DNI',        desc: 'Usa tu número de DNI como usuario. El personal del colegio usa su correo institucional.' },
                { n: '02', title: 'Completa tus actividades',  desc: 'Responde las encuestas y evaluaciones que te asignen, con calma y honestidad.' },
                { n: '03', title: 'Recibe acompañamiento',     desc: 'El equipo de psicología revisa tus respuestas y te orienta cuando lo necesites.' },
              ].map(({ n, title, desc }) => (
                <div key={n} className={styles.step}>
                  <span className={styles.stepNum}>{n}</span>
                  <h4 className={styles.stepTitle}>{title}</h4>
                  <p  className={styles.stepDesc}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ PRIVACY ═════════════════════════════════════ */}
      <section className={styles.block} id="privacidad">
        <div className={styles.wrap}>
          <div className={styles.privacyGrid}>

            <div className={`${styles.privacyVisual} ${styles.reveal}`}>
              <div className={styles.privacyLock}>
                <svg className={styles.privacyLockIcon} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3 className={styles.privacyVisualTitle}>Tu confianza es lo primero</h3>
              <p  className={styles.privacyVisualDesc}>
                Lo que compartes aquí se mantiene privado. Nadie de tus compañeros puede ver tus respuestas.
              </p>
            </div>

            <div className={styles.reveal}>
              <span className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                Privacidad y confianza
              </span>
              <h2 className={styles.privacySubtitle}>Un espacio seguro para expresarte</h2>
              <ul className={styles.privacyList}>
                {[
                  { title: 'Acceso restringido', desc: 'Solo el área de psicología autorizada del colegio puede ver tu información.' },
                  { title: 'Sin juicios',        desc: 'No hay respuestas buenas ni malas. Este es tu espacio para ser honesto contigo.' },
                  { title: 'Datos protegidos',   desc: 'Tu información se guarda de forma segura y se usa únicamente para acompañarte.' },
                ].map(({ title, desc }) => (
                  <li key={title} className={styles.privacyItem}>
                    <span className={styles.privacyCheck}>
                      <CheckCircle2 className={styles.privacyCheckIcon} />
                    </span>
                    <div>
                      <h4 className={styles.privacyItemTitle}>{title}</h4>
                      <p  className={styles.privacyItemDesc}>{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════ */}
      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footGrid}>

            <div>
              <div className={styles.brand} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className={styles.brandMark}>
                  <svg className={styles.brandMarkIcon} viewBox="0 0 24 24" fill="none">
                    <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" fill="#fff"/>
                  </svg>
                </div>
                <div>
                  <span className={styles.footBrandName}>
                    Psico<span className={styles.footBrandAccent}>Escolar</span>
                  </span>
                  <span className={styles.footBrandSub} style={{ display: 'block' }}>
                    I.E. 40122 Manuel Scorza Torres
                  </span>
                </div>
              </div>
              <p className={styles.footAbout}>
                Plataforma de acompañamiento psicológico y bienestar emocional para la comunidad
                estudiantil de la Institución Educativa 40122 Manuel Scorza Torres.
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
            <span>PsicoEscolar v1.0 · 2026</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
