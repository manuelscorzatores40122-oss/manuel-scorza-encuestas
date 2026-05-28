'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, User, KeyRound, UserPlus, Phone, Mail } from 'lucide-react';
import { createStudentAction } from './actions';
import styles from './nuevo.module.css';

type Grade   = { id: string; name: string; nivel: 'PRIMARIA' | 'SECUNDARIA'; order: number };
type Section = { id: string; name: string; gradeId: string };

type Credenciales = {
  usuario:   string;
  contrasena: string;
  nombre:    string;
  apoderado: string;
  celular:   string | null;
  correo:    string | null;
};

interface Props {
  grades:   Grade[];
  sections: Section[];
}

export function FormularioNuevoEstudiante({ grades, sections }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError]           = useState<string | null>(null);
  const [creds, setCreds]           = useState<Credenciales | null>(null);

  const [nivel,     setNivel]     = useState('');
  const [gradoId,   setGradoId]   = useState('');
  const [seccionId, setSeccionId] = useState('');

  const gradosFiltrados    = nivel    ? grades.filter(g => g.nivel === nivel) : grades;
  const seccionesFiltradas = gradoId  ? sections.filter(s => s.gradeId === gradoId) : sections;

  function onNivel(v: string) { setNivel(v); setGradoId(''); setSeccionId(''); }
  function onGrado(v: string) { setGradoId(v); setSeccionId(''); }

  function handleSubmit(formData: FormData) {
    formData.set('sectionId', seccionId);
    setError(null);
    startTransition(async () => {
      const r = await createStudentAction(formData);
      if (r.ok) {
        setCreds(r.credenciales);
      } else {
        setError(r.error);
      }
    });
  }

  /* ── Pantalla de credenciales ── */
  if (creds) {
    return (
      <div className={styles.credsCard}>
        <div className={styles.credsIconRow}>
          <CheckCircle className={styles.credsIcon} />
        </div>
        <h2 className={styles.credsTitle}>Estudiante registrado</h2>
        <p className={styles.credsName}>{creds.nombre}</p>
        <p className={styles.credsSub}>
          Comparte estas credenciales con el estudiante para que pueda iniciar sesión.
        </p>

        <div className={styles.credsList}>
          <div className={styles.credsItem}>
            <span className={styles.credsItemLabel}><User size={13} /> Usuario</span>
            <span className={styles.credsItemValue}>{creds.usuario}</span>
          </div>
          <div className={styles.credsItem}>
            <span className={styles.credsItemLabel}><KeyRound size={13} /> Contraseña temporal</span>
            <span className={styles.credsItemValue}>{creds.contrasena}</span>
          </div>
        </div>

        <div className={styles.credsNotif}>
          <p className={styles.credsNotifTitle}>Notificación automática</p>
          <p className={styles.credsNotifSub}>
            Se enviará al apoderado <strong>{creds.apoderado}</strong>:
          </p>
          <div className={styles.credsNotifChannels}>
            {creds.celular ? (
              <span className={styles.credsChannel}>
                <Phone size={13} /> {creds.celular}
              </span>
            ) : (
              <span className={styles.credsChannelNone}>Sin celular registrado</span>
            )}
            {creds.correo ? (
              <span className={styles.credsChannel}>
                <Mail size={13} /> {creds.correo}
              </span>
            ) : null}
          </div>
        </div>

        <p className={styles.credsNote}>
          La contraseña puede cambiarse al iniciar sesión por primera vez.
        </p>

        <div className={styles.credsActions}>
          <button
            onClick={() => router.push('/psicologo/estudiantes')}
            className={styles.btnSecondary}
          >
            Ver lista de estudiantes
          </button>
          <button
            onClick={() => {
              setCreds(null);
              setNivel('');
              setGradoId('');
              setSeccionId('');
            }}
            className={styles.btnPrimary}
          >
            <UserPlus size={14} /> Registrar otro
          </button>
        </div>
      </div>
    );
  }

  /* ── Formulario ── */
  return (
    <form action={handleSubmit} className={styles.form}>

      {error && (
        <div className={styles.msgErr}>{error}</div>
      )}

      {/* ── Nivel · Grado · Sección ── */}
      <section className={styles.section}>
        <h2 className={styles.sectTitle}>Nivel · Grado · Sección</h2>
        <div className={styles.fieldRow}>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Nivel <span className={styles.req}>*</span></label>
            <select value={nivel} onChange={e => onNivel(e.target.value)} className={styles.fieldSelect} required>
              <option value="">Seleccionar…</option>
              <option value="PRIMARIA">Primaria</option>
              <option value="SECUNDARIA">Secundaria</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Grado <span className={styles.req}>*</span></label>
            <select value={gradoId} onChange={e => onGrado(e.target.value)} className={styles.fieldSelect} disabled={!nivel} required>
              <option value="">Seleccionar…</option>
              {gradosFiltrados.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Sección <span className={styles.req}>*</span></label>
            <select value={seccionId} onChange={e => setSeccionId(e.target.value)} className={styles.fieldSelect} disabled={!gradoId} required>
              <option value="">Seleccionar…</option>
              {seccionesFiltradas.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

        </div>
      </section>

      {/* ── Datos del estudiante ── */}
      <section className={styles.section}>
        <h2 className={styles.sectTitle}>Datos del estudiante</h2>
        <div className={styles.fieldGrid}>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Apellido paterno <span className={styles.req}>*</span></label>
            <input name="apellidoPaterno" required className={styles.fieldInput} placeholder="GARCIA" />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Apellido materno <span className={styles.req}>*</span></label>
            <input name="apellidoMaterno" required className={styles.fieldInput} placeholder="LOPEZ" />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Nombres <span className={styles.req}>*</span></label>
            <input name="nombres" required className={styles.fieldInput} placeholder="JUAN CARLOS" />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>DNI <span className={styles.req}>*</span></label>
            <input name="dni" required pattern="\d{8}" maxLength={8} className={styles.fieldInput} placeholder="12345678" />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Código de estudiante</label>
            <input name="codigoEstudiante" className={styles.fieldInput} placeholder="Opcional" />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Sexo <span className={styles.req}>*</span></label>
            <select name="sexo" required className={styles.fieldSelect}>
              <option value="">Seleccionar…</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Fecha de nacimiento <span className={styles.req}>*</span></label>
            <input name="fechaNacimiento" type="date" required className={styles.fieldInput} />
          </div>

        </div>
      </section>

      {/* ── Apoderado ── */}
      <section className={styles.section}>
        <h2 className={styles.sectTitle}>Apoderado / Contacto</h2>
        <p className={styles.sectHint}>
          Los datos de contacto se usarán para enviar las credenciales y notificaciones.
        </p>
        <div className={styles.fieldGrid}>

          <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
            <label className={styles.fieldLabel}>Nombres y apellidos <span className={styles.req}>*</span></label>
            <input name="apNombres" required className={styles.fieldInput} placeholder="GARCIA LOPEZ, MARIA" />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Parentesco <span className={styles.req}>*</span></label>
            <select name="apParentesco" required className={styles.fieldSelect}>
              <option value="">Seleccionar…</option>
              <option value="MADRE">Madre</option>
              <option value="PADRE">Padre</option>
              <option value="APODERADO">Apoderado</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Celular (WhatsApp) <span className={styles.req}>*</span>
            </label>
            <div className={styles.inputIcon}>
              <Phone size={14} className={styles.inputIconIcon} />
              <input
                name="apCelular"
                className={styles.fieldInputIcon}
                placeholder="987654321"
                maxLength={12}
                inputMode="tel"
              />
            </div>
            <span className={styles.fieldHint}>9 dígitos, sin código de país</span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Correo electrónico</label>
            <div className={styles.inputIcon}>
              <Mail size={14} className={styles.inputIconIcon} />
              <input
                name="apCorreo"
                type="email"
                className={styles.fieldInputIcon}
                placeholder="apoderado@gmail.com"
              />
            </div>
            <span className={styles.fieldHint}>Opcional</span>
          </div>

        </div>
      </section>

      {/* ── Acciones ── */}
      <div className={styles.formActions}>
        <button type="button" onClick={() => router.back()} className={styles.btnSecondary}>
          Cancelar
        </button>
        <button type="submit" disabled={pending || !seccionId} className={styles.btnPrimary}>
          {pending ? 'Registrando…' : 'Registrar estudiante'}
        </button>
      </div>

    </form>
  );
}
