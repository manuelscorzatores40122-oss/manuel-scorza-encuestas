import Link from 'next/link';

import {
  Plus,
  ClipboardList,
  ChevronDown,
} from 'lucide-react';

import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

import styles from './page.module.css';
import { SurveyActions } from './SurveyActions';

export default async function EncuestasPsicologo() {
  const surveys = await prisma.survey.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      _count: {
        select: {
          responses: true,
          questions: true,
        },
      },
    },
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <ClipboardList className={styles.titleIcon} />
          Encuestas
        </h1>

        <Link href="/psicologo/encuestas/nueva" className={styles.newButton}>
          <Plus className={styles.buttonIcon} />
          Nueva encuesta
        </Link>
      </div>

      {/* Vista escritorio */}
      <div className={styles.desktopTable}>
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th>Título</th>
                <th className={styles.center}>Preguntas</th>
                <th className={styles.center}>Respuestas</th>
                <th className={styles.center}>Estado</th>
                <th>Creada</th>
                <th className={styles.right}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {surveys.map((survey) => (
                <tr key={survey.id} className={styles.row}>
                  <td className={styles.surveyTitle}>{survey.title}</td>
                  <td className={styles.center}>{survey._count.questions}</td>
                  <td className={styles.center}>{survey._count.responses}</td>

                  <td className={styles.center}>
                    <span
                      className={
                        survey.isActive
                          ? styles.activeBadge
                          : styles.inactiveBadge
                      }
                    >
                      {survey.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>

                  <td className={styles.date}>
                    {formatDate(survey.createdAt)}
                  </td>

                  <td className={styles.right}>
                    <div className={styles.actions}>
                      <SurveyActions
                        id={survey.id}
                        title={survey.title}
                        isActive={survey.isActive}
                        responsesCount={survey._count.responses}
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {surveys.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    No hay encuestas creadas todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista móvil tipo combo box */}
      <div className={styles.mobileList}>
        {surveys.map((survey) => (
          <details key={survey.id} className={styles.mobileSurvey}>
            <summary className={styles.mobileSummary}>
              <div>
                <p className={styles.mobileTitle}>{survey.title}</p>

                <span
                  className={
                    survey.isActive
                      ? styles.activeBadge
                      : styles.inactiveBadge
                  }
                >
                  {survey.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <ChevronDown className={styles.chevronIcon} />
            </summary>

            <div className={styles.mobileContent}>
              <div className={styles.mobileInfo}>
                <span>Preguntas</span>
                <strong>{survey._count.questions}</strong>
              </div>

              <div className={styles.mobileInfo}>
                <span>Respuestas</span>
                <strong>{survey._count.responses}</strong>
              </div>

              <div className={styles.mobileInfo}>
                <span>Creada</span>
                <strong>{formatDate(survey.createdAt)}</strong>
              </div>

              <div className={styles.mobileActions}>
                <SurveyActions
                  id={survey.id}
                  title={survey.title}
                  isActive={survey.isActive}
                  responsesCount={survey._count.responses}
                  variant="mobile"
                />
              </div>
            </div>
          </details>
        ))}

        {surveys.length === 0 && (
          <div className={styles.emptyMobile}>
            No hay encuestas creadas todavía.
          </div>
        )}
      </div>
    </div>
  );
}
