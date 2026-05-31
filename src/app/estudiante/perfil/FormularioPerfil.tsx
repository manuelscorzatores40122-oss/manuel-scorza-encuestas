'use client';

import { useState, useTransition, useRef } from 'react';
import { Save, User, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import { updateStudentProfileAction } from './actions';
import styles from './perfil.module.css';

type Contact = {
  parentesco: 'PADRE' | 'MADRE' | 'APODERADO' | 'OTRO';
  apellidosNombres: string;
  sexo: 'M' | 'F' | null;
  numeroDocumento: string | null;
  correo: string | null;
  celular: string | null;
};

const SECTIONS = [
  { key: 'padre'     as const, label: 'Padre',                          color: 'blue'  },
  { key: 'madre'     as const, label: 'Madre',                          color: 'rose'  },
  { key: 'apoderado' as const, label: 'Apoderado / contacto principal', color: 'amber' },
];

export function FormularioPerfil({ contacts }: { contacts: Record<string, Contact | null> }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg]         = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({
    padre: false, madre: false, apoderado: false,
  });
  const activeSection = useRef<string>('');

  function submit(formData: FormData) {
    setMsg(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateStudentProfileAction(formData);
      if (result.ok) {
        setSuccess(true);
        setMsg('Guardado correctamente.');
        setOpen(prev => ({ ...prev, [activeSection.current]: false }));
      } else {
        setSuccess(false);
        setMsg(result.error || 'Error al guardar.');
      }
    });
  }

  function toggle(key: string, isOpen: boolean) {
    setOpen(prev => ({ ...prev, [key]: isOpen }));
  }

  return (
    <form action={submit} className={styles.form}>

      {SECTIONS.map(({ key, label, color }) => {
        const c = contacts[key];
        return (
          <details
            key={key}
            className={styles.section}
            open={open[key]}
            onToggle={(e) => toggle(key, (e.currentTarget as HTMLDetailsElement).open)}
          >

            <summary className={`${styles.sectionHead} ${styles[`sectionHead_${color}`]}`}>
              <div className={`${styles.sectionIconWrap} ${styles[`sectionIconWrap_${color}`]}`}>
                <User className={styles.sectionIcon} />
              </div>
              <h2 className={`${styles.sectionTitle} ${styles[`sectionTitle_${color}`]}`}>
                {label}
              </h2>
              <ChevronDown className={styles.sectionChevron} />
            </summary>

            <div className={styles.sectionBody}>
              <div className={styles.fieldGrid}>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>Apellidos y nombres</label>
                  <input
                    name={`${key}.name`}
                    className={styles.input}
                    defaultValue={c?.apellidosNombres || ''}
                    placeholder="Apellidos y nombres completos"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Sexo</label>
                  <select name={`${key}.sexo`} className={styles.input} defaultValue={c?.sexo || ''}>
                    <option value="">No especificar</option>
                    <option value="F">Mujer</option>
                    <option value="M">Hombre</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>N° documento</label>
                  <input
                    name={`${key}.document`}
                    className={styles.input}
                    defaultValue={c?.numeroDocumento || ''}
                    placeholder="DNI / CE"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Correo electrónico</label>
                  <input
                    type="email"
                    name={`${key}.email`}
                    className={styles.input}
                    defaultValue={c?.correo || ''}
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Celular / emergencia</label>
                  <input
                    name={`${key}.phone`}
                    className={styles.input}
                    defaultValue={c?.celular || ''}
                    placeholder="999 999 999"
                  />
                </div>

              </div>

              <div className={styles.sectionFooter}>
                {msg && open[key] && (
                  <div className={success
                    ? `${styles.alert} ${styles.alertSuccess}`
                    : `${styles.alert} ${styles.alertError}`
                  }>
                    {success
                      ? <CheckCircle2 className={styles.alertIcon} />
                      : <XCircle      className={styles.alertIcon} />}
                    {msg}
                  </div>
                )}
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={pending}
                  onClick={() => { activeSection.current = key; }}
                >
                  <Save className={styles.saveBtnIcon} />
                  {pending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>

            </div>
          </details>
        );
      })}

    </form>
  );
}
