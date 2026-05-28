'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteStudentAction } from './actions';
import styles from './page.module.css';

interface Props {
  studentId: string;
  nombre:    string;
}

export function BtnEliminarEstudiante({ studentId, nombre }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition]  = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteStudentAction(studentId);
    });
  }

  if (confirming) {
    return (
      <div className={styles.deleteConfirm}>
        <span className={styles.deleteConfirmText}>
          ¿Eliminar a <strong>{nombre}</strong>? Esta acción no se puede deshacer.
        </span>
        <div className={styles.deleteConfirmBtns}>
          <button
            onClick={() => setConfirming(false)}
            disabled={pending}
            className={styles.deleteCancel}
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={pending}
            className={styles.deleteConfirmBtn}
          >
            {pending ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className={styles.deleteBtn}>
      <Trash2 size={14} strokeWidth={1.8} />
      Eliminar estudiante
    </button>
  );
}
