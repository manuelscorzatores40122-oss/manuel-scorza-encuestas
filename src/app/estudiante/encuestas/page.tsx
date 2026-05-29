import Link from 'next/link';
import { ClipboardList, HelpCircle, ChevronRight } from 'lucide-react';
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

    const allActive = await prisma.survey.findMany({
      where:   { isActive: true, responses: { none: { studentId: student.id } } },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true } } },
    });

    const gradeId   = student.section?.gradeId   ?? '';
    const sectionId = student.sectionId           ?? '';

    const surveys = allActive.filter(s => {
      const tg = s.targetGrades   ?? [];
      const ts = s.targetSections ?? [];
      return (tg.length === 0 || tg.includes(gradeId))
          && (ts.length === 0 || ts.includes(sectionId));
    });

    return (
      <div className={styles.page}>

        {/* Banner superior */}
        <div className={styles.banner}>
          <div className={styles.bannerIcon}>
            <ClipboardList className={styles.bannerIconSvg} />
          </div>
          <div className={styles.bannerText}>
            <h1 className={styles.bannerTitle}>Encuestas disponibles</h1>
            <p className={styles.bannerSub}>
              {surveys.length > 0
                ? `${surveys.length} pendiente${surveys.length > 1 ? 's' : ''} por responder`
                : 'No tienes encuestas pendientes'}
            </p>
          </div>
          {surveys.length > 0 && (
            <span className={styles.bannerBadge}>{surveys.length}</span>
          )}
        </div>

        {/* Grilla de tarjetas */}
        <div className={styles.grid}>
          {surveys.map((s) => (
            <Link key={s.id} href={`/estudiante/encuestas/${s.id}`} className={styles.card}>

              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrap}>
                  <ClipboardList className={styles.cardIcon} />
                </div>
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{s.title}</h3>
                {s.description && (
                  <p className={styles.cardDesc}>{s.description}</p>
                )}
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.cardQuestions}>
                  <HelpCircle className={styles.cardQIcon} />
                  {s._count.questions} pregunta{s._count.questions !== 1 ? 's' : ''}
                </span>
                <span className={styles.cardCta}>
                  Responder
                  <ChevronRight className={styles.cardCtaIcon} />
                </span>
              </div>

            </Link>
          ))}

          {surveys.length === 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📋</span>
              <p className={styles.emptyTitle}>¡Todo al día!</p>
              <p className={styles.emptyDesc}>No tienes encuestas pendientes por responder.</p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error cargando encuestas del estudiante:', error);
    return <DatabaseUnavailable />;
  }
}
