'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Check, RotateCcw } from 'lucide-react';
import { markAlertReviewedAction, reopenAlertAction } from './actions';
import styles from './alertas.module.css';

type Props = {
  alertId: string;
  studentId: string;
  isReviewed: boolean;
};

export function AccionesAlerta({ alertId, studentId, isReviewed }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function markReviewed() {
    startTransition(async () => {
      await markAlertReviewedAction(alertId);
      router.refresh();
    });
  }

  function reopen() {
    startTransition(async () => {
      await reopenAlertAction(alertId);
      router.refresh();
    });
  }

  return (
    <div className={styles.aActions}>
      <Link
        href={`/psicologo/estudiantes/${studentId}`}
        className={`${styles.abtn} ${styles.abtnPrimary}`}
      >
        <User />
        Ver ficha
      </Link>

      {!isReviewed ? (
        <button
          type="button"
          className={styles.abtn}
          disabled={pending}
          onClick={markReviewed}
        >
          <Check />
          {pending ? 'Procesando…' : 'Marcar revisada'}
        </button>
      ) : (
        <button
          type="button"
          className={styles.abtn}
          disabled={pending}
          onClick={reopen}
        >
          <RotateCcw />
          {pending ? 'Procesando…' : 'Reabrir'}
        </button>
      )}
    </div>
  );
}
