'use client';

import { useState, useTransition } from 'react';
import { Plus, KeyRound, UserX, UserCheck } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/constants';
import {
  createUserAction,
  resetPasswordAction,
  deactivateUserAction,
  activateUserAction,
} from './actions';
import { useRouter } from 'next/navigation';
import styles from './TablaUsuarios.module.css';

type U = {
  id: string;
  username: string;
  fullName: string;
  role: string;
  email: string | null;
  isActive: boolean;
  lastLogin: string | null;
};

const ROLE_BADGE: Record<string, string> = {
  ADMIN:        styles.roleAdmin,
  PSYCHOLOGIST: styles.rolePsychologist,
  DIRECTOR:     styles.roleDirector,
  AUXILIAR:     styles.roleAuxiliar,
  STUDENT:      styles.roleStudent,
};

export function TablaUsuarios({ users }: { users: U[] }) {
  const router = useRouter();
  const [showNew, setShowNew]   = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg]           = useState<string | null>(null);

  function newUser(formData: FormData) {
    startTransition(async () => {
      const r = await createUserAction(formData);
      if (r.ok) {
        setMsg(`Usuario creado. Clave temporal: ${r.tempPassword}`);
        setShowNew(false);
        router.refresh();
      } else {
        setMsg(`Error: ${r.error}`);
      }
    });
  }

  function reset(id: string) {
    if (!confirm('¿Generar nueva clave para este usuario?')) return;
    startTransition(async () => {
      const r = await resetPasswordAction(id);
      if (r.ok) setMsg(`Nueva clave temporal: ${r.tempPassword}`);
      else       setMsg(`Error: ${r.error}`);
    });
  }

  function deactivate(id: string) {
    if (!confirm('¿Desactivar este usuario? Ya no podrá iniciar sesión.')) return;
    startTransition(async () => {
      await deactivateUserAction(id);
      router.refresh();
    });
  }

  function activate(id: string) {
    if (!confirm('¿Reactivar este usuario? Podrá volver a iniciar sesión.')) return;
    startTransition(async () => {
      await activateUserAction(id);
      router.refresh();
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div>
        <button onClick={() => setShowNew(!showNew)} className={styles.newBtn}>
          <Plus style={{ width: 15, height: 15 }} strokeWidth={2} />
          Nuevo usuario
        </button>
      </div>

      {msg && (
        <div className={styles.msgBanner}>
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className={styles.msgClose}>cerrar</button>
        </div>
      )}

      {showNew && (
        <form action={newUser} className={styles.newForm}>
          <div>
            <label className={styles.formLabel}>Nombre completo</label>
            <input name="fullName" required className={styles.formInput} />
          </div>
          <div>
            <label className={styles.formLabel}>Correo / usuario</label>
            <input
              name="username"
              required
              className={styles.formInput}
              placeholder="usuario@scorzatorres.edu.pe"
            />
          </div>
          <div>
            <label className={styles.formLabel}>Rol</label>
            <select name="role" required className={styles.formInput}>
              {Object.entries(ROLE_LABELS)
                .filter(([k]) => k !== 'STUDENT')
                .map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
            </select>
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className={styles.btnSecondary}
            >
              Cancelar
            </button>
            <button type="submit" disabled={pending} className={styles.btnPrimary}>
              {pending ? 'Creando…' : 'Crear usuario'}
            </button>
          </div>
        </form>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Nombre</th>
              <th className={styles.th}>Usuario</th>
              <th className={styles.th}>Rol</th>
              <th className={styles.th}>Último acceso</th>
              <th className={`${styles.th} ${styles.thRight}`}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={`${styles.tr} ${!u.isActive ? styles.trInactive : ''}`}>
                <td className={styles.td}>
                  <span className={`${styles.tdName} ${!u.isActive ? styles.nameStrike : ''}`}>
                    {u.fullName}
                  </span>
                  {!u.isActive && (
                    <span className={styles.badgeInactive}>Inactivo</span>
                  )}
                </td>
                <td className={`${styles.td} ${styles.tdUser}`}>{u.username}</td>
                <td className={styles.td}>
                  <span className={`${styles.badge} ${ROLE_BADGE[u.role] ?? styles.roleDefault}`}>
                    {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.tdTime}`} suppressHydrationWarning>
                  {u.lastLogin
                    ? new Date(u.lastLogin).toLocaleString('es-PE', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : 'Nunca'}
                </td>
                <td className={`${styles.td} ${styles.tdActions}`}>
                  {u.isActive ? (
                    <>
                      <button
                        onClick={() => reset(u.id)}
                        disabled={pending}
                        className={`${styles.actionBtn} ${styles.actionReset}`}
                      >
                        <KeyRound style={{ width: 13, height: 13 }} strokeWidth={1.8} />
                        Resetear clave
                      </button>
                      <button
                        onClick={() => deactivate(u.id)}
                        disabled={pending}
                        className={`${styles.actionBtn} ${styles.actionDeactivate}`}
                      >
                        <UserX style={{ width: 13, height: 13 }} strokeWidth={1.8} />
                        Desactivar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => activate(u.id)}
                      disabled={pending}
                      className={`${styles.actionBtn} ${styles.actionActivate}`}
                    >
                      <UserCheck style={{ width: 13, height: 13 }} strokeWidth={1.8} />
                      Reactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.empty}>No hay usuarios.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
