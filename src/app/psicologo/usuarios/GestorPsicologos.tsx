'use client';

import { useState, useTransition } from 'react';
import { Plus, KeyRound, UserX, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  createPsychologistAction,
  resetPsychologistPasswordAction,
  deactivatePsychologistAction,
  activatePsychologistAction,
} from './actions';
import styles from './usuarios.module.css';

type Psi = {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  isActive: boolean;
  lastLogin: Date | null;
};

export function GestorPsicologos({ psicologos }: { psicologos: Psi[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function newPsi(formData: FormData) {
    startTransition(async () => {
      const r = await createPsychologistAction(formData);
      if (r.ok) {
        setMsg({ ok: true, text: `Psicólogo creado. Clave temporal: ${r.tempPassword}` });
        setShowNew(false);
        router.refresh();
      } else {
        setMsg({ ok: false, text: `Error: ${r.error}` });
      }
    });
  }

  function reset(id: string) {
    if (!confirm('¿Generar nueva clave para este psicólogo?')) return;
    startTransition(async () => {
      const r = await resetPsychologistPasswordAction(id);
      if (r.ok) setMsg({ ok: true, text: `Nueva clave temporal: ${r.tempPassword}` });
      else       setMsg({ ok: false, text: `Error: ${r.error}` });
    });
  }

  function deactivate(id: string) {
    if (!confirm('¿Desactivar este psicólogo? Ya no podrá iniciar sesión.')) return;
    startTransition(async () => {
      await deactivatePsychologistAction(id);
      router.refresh();
    });
  }

  function activate(id: string) {
    if (!confirm('¿Reactivar este psicólogo?')) return;
    startTransition(async () => {
      await activatePsychologistAction(id);
      router.refresh();
    });
  }

  return (
    <div className={styles.gestorWrap}>

      <div className={styles.toolbar}>
        <button onClick={() => { setShowNew(!showNew); setMsg(null); }} className={styles.newBtn}>
          <Plus size={15} strokeWidth={2} />
          Nuevo psicólogo
        </button>
      </div>

      {msg && (
        <div className={`${styles.msgBanner} ${msg.ok ? styles.msgOk : styles.msgErr}`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className={styles.msgClose}>cerrar</button>
        </div>
      )}

      {showNew && (
        <form action={newPsi} className={styles.newForm}>
          <h3 className={styles.formTitle}>Registrar nuevo psicólogo</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nombre completo</label>
              <input name="fullName" required className={styles.formInput} placeholder="Ej. María García López" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Correo / usuario</label>
              <input
                name="username"
                required
                type="email"
                className={styles.formInput}
                placeholder="psicologo@scorzatorres.edu.pe"
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" onClick={() => setShowNew(false)} className={styles.btnSecondary}>
              Cancelar
            </button>
            <button type="submit" disabled={pending} className={styles.btnPrimary}>
              {pending ? 'Creando…' : 'Crear psicólogo'}
            </button>
          </div>
        </form>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Nombre</th>
              <th className={styles.th}>Usuario / correo</th>
              <th className={styles.th}>Estado</th>
              <th className={styles.th}>Último acceso</th>
              <th className={`${styles.th} ${styles.thRight}`}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {psicologos.map(p => (
              <tr key={p.id} className={`${styles.tr} ${!p.isActive ? styles.trInactive : ''}`}>
                <td className={styles.td}>
                  <span className={`${styles.tdName} ${!p.isActive ? styles.nameStrike : ''}`}>
                    {p.fullName}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.tdUser}`}>{p.username}</td>
                <td className={styles.td}>
                  <span className={`${styles.badge} ${p.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                    {p.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.tdTime}`} suppressHydrationWarning>
                  {p.lastLogin
                    ? new Date(p.lastLogin).toLocaleString('es-PE', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : 'Nunca'}
                </td>
                <td className={`${styles.td} ${styles.tdActions}`}>
                  {p.isActive ? (
                    <>
                      <button onClick={() => reset(p.id)} disabled={pending} className={`${styles.actionBtn} ${styles.actionReset}`}>
                        <KeyRound size={13} strokeWidth={1.8} /> Resetear clave
                      </button>
                      <button onClick={() => deactivate(p.id)} disabled={pending} className={`${styles.actionBtn} ${styles.actionDeactivate}`}>
                        <UserX size={13} strokeWidth={1.8} /> Desactivar
                      </button>
                    </>
                  ) : (
                    <button onClick={() => activate(p.id)} disabled={pending} className={`${styles.actionBtn} ${styles.actionActivate}`}>
                      <UserCheck size={13} strokeWidth={1.8} /> Reactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {psicologos.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.empty}>No hay psicólogos registrados aún.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
