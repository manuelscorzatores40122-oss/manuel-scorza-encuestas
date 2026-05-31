import Link from 'next/link';
import {
  ClipboardList, AlertCircle, CheckCircle2,
  HelpCircle, Pen, ChevronDown,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DatabaseUnavailable } from '@/components/BaseDatosNoDisponible';
import styles from './encuestas.module.css';

export default async function EncuestasEstudiante() {
  const session = (await getSession())!;

  try {
    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      include: { section: true },
    });

    if (!student) return null;

    const gradeId   = student.section?.gradeId ?? '';
    const sectionId = student.sectionId        ?? '';

    const [rawPending, completed] = await Promise.all([
      prisma.survey.findMany({
        where:   { isActive: true, responses: { none: { studentId: student.id } } },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { questions: true } } },
      }),
      prisma.survey.findMany({
        where:   { isActive: true, responses: { some: { studentId: student.id } } },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { questions: true } } },
      }),
    ]);

    const pending = rawPending.filter(s => {
      const tg = s.targetGrades   ?? [];
      const ts = s.targetSections ?? [];
      return (tg.length === 0 || tg.includes(gradeId))
          && (ts.length === 0 || ts.includes(sectionId));
    });

    return (
      <div className={styles.page}>

        {/* Banner */}
        <div className={styles.banner}>
          <div className={styles.bannerIconWrap}>
            <ClipboardList className={styles.bannerIconSvg} />
          </div>
          <div className={styles.bannerText}>
            <h1 className={styles.bannerTitle}>Encuestas disponibles</h1>
            <p className={styles.bannerSub}>
              {pending.length > 0
                ? `${pending.length} pendiente${pending.length > 1 ? 's' : ''} por responder`
                : 'No tienes encuestas pendientes'}
            </p>
          </div>
          {pending.length > 0 && (
            <span className={styles.bannerBadge}>{pending.length}</span>
          )}
        </div>

        {/* Vacío total */}
        {pending.length === 0 && completed.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📋</span>
            <p className={styles.emptyTitle}>¡Todo al día!</p>
            <p className={styles.emptyDesc}>No tienes encuestas pendientes por responder.</p>
          </div>
        )}

        {/* ── Grupo: Pendientes (solo si hay) ── */}
        {pending.length > 0 && (
          <details className={styles.group} open>
            <summary className={styles.groupSummary}>
              <AlertCircle className={styles.groupSummaryIcon} />
              <span className={styles.groupSummaryTitle}>Pendientes</span>
              <span className={styles.groupBadge}>{pending.length}</span>
              <ChevronDown className={styles.groupChevron} />
            </summary>

            <div className={styles.groupList}>
              {pending.map((s, i) => (
                <details key={s.id} className={styles.encCard}>
                  <summary className={styles.encCardSummary}>
                    <div className={styles.encCardIcon}>
                      <ClipboardList className={styles.encCardIconSvg} />
                    </div>
                    <span className={styles.encCardTitle}>{s.title}</span>
                    <span className={styles.encCardNum}>{i + 1}</span>
                    <ChevronDown className={styles.encChevron} />
                  </summary>

                  <div className={styles.encCardBody}>
                    {s.description && (
                      <p className={styles.encCardDesc}>{s.description}</p>
                    )}
                    <div className={styles.encCardFooter}>
                      <span className={styles.questionCount}>
                        <HelpCircle className={styles.questionIcon} />
                        {s._count.questions} pregunta{s._count.questions !== 1 ? 's' : ''}
                      </span>
                      <Link href={`/estudiante/encuestas/${s.id}`} className={styles.respondBtn}>
                        <Pen className={styles.btnIcon} />
                        Responder
                      </Link>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </details>
        )}

        {/* ── Grupo: Completadas ── */}
        {completed.length > 0 && (
          <details className={styles.group}>
            <summary className={`${styles.groupSummary} ${styles.groupSummaryDone}`}>
              <CheckCircle2 className={styles.groupSummaryIcon} />
              <span className={styles.groupSummaryTitle}>Completadas</span>
              <span className={`${styles.groupBadge} ${styles.groupBadgeDone}`}>{completed.length}</span>
              <ChevronDown className={styles.groupChevron} />
            </summary>

            <div className={styles.groupList}>
              {completed.map((s, i) => (
                <details key={s.id} className={`${styles.encCard} ${styles.encCardDone}`}>
                  <summary className={styles.encCardSummary}>
                    <div className={`${styles.encCardIcon} ${styles.encCardIconDone}`}>
                      <CheckCircle2 className={styles.encCardIconSvg} />
                    </div>
                    <span className={styles.encCardTitle}>{s.title}</span>
                    <span className={`${styles.encCardNum} ${styles.encCardNumDone}`}>{i + 1}</span>
                    <ChevronDown className={styles.encChevron} />
                  </summary>

                  <div className={styles.encCardBody}>
                    {s.description && (
                      <p className={styles.encCardDesc}>{s.description}</p>
                    )}
                    <div className={styles.encCardFooter}>
                      <span className={`${styles.questionCount} ${styles.questionCountDone}`}>
                        <CheckCircle2 className={styles.questionIcon} />
                        Respondida
                      </span>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </details>
        )}

      </div>
    );
  } catch (error) {
    console.error('Error cargando encuestas del estudiante:', error);
    return <DatabaseUnavailable />;
  }
}
