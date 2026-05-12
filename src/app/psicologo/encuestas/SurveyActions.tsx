'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Power, Trash2 } from 'lucide-react';
import { deleteSurveyAction, toggleSurveyAction } from './actions';
import styles from './page.module.css';

type SurveyActionsProps = {
  id: string;
  title: string;
  isActive: boolean;
  responsesCount: number;
  variant?: 'desktop' | 'mobile';
};

export function SurveyActions({
  id,
  title,
  isActive,
  responsesCount,
  variant = 'desktop',
}: SurveyActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const toggleClass = variant === 'mobile' ? styles.mobileToggleButton : styles.toggleButton;
  const deleteClass = variant === 'mobile' ? styles.mobileDeleteButton : styles.deleteButton;

  function toggleSurvey() {
    startTransition(async () => {
      await toggleSurveyAction(id);
      router.refresh();
    });
  }

  function deleteSurvey() {
    const message = responsesCount > 0
      ? `La encuesta "${title}" tiene ${responsesCount} respuesta(s). Se eliminarán la encuesta, sus preguntas, respuestas y alertas asociadas. ¿Continuar?`
      : `¿Eliminar definitivamente la encuesta "${title}"?`;

    if (!window.confirm(message)) return;

    startTransition(async () => {
      await deleteSurveyAction(id);
      router.refresh();
    });
  }

  return (
    <>
      <button type="button" className={toggleClass} disabled={pending} onClick={toggleSurvey}>
        <Power className={styles.smallIcon} />
        {isActive ? 'Desactivar' : 'Activar'}
      </button>

      <button type="button" className={deleteClass} disabled={pending} onClick={deleteSurvey}>
        <Trash2 className={styles.smallIcon} />
        {pending ? 'Procesando...' : 'Eliminar'}
      </button>
    </>
  );
}
