import { History, CheckCircle2 } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import styles from './historial.module.css';

export default async function HistorialEstudiante() {
  const session = (await getSession())!;
  const student = await prisma.student.findUnique({ where: { userId: session.userId } });
  if (!student) return null;

  const responses = await prisma.response.findMany({
    where:   { studentId: student.id },
    include: { survey: true },
    orderBy: { submittedAt: 'desc' },
  });

  return (
    <div className={styles.page}>

      {/* Banner */}
      <div className={styles.banner}>
        <div className={styles.bannerIcon}>
          <History className={styles.bannerIconSvg} />
        </div>
        <div className={styles.bannerText}>
          <h1 className={styles.bannerTitle}>Mi historial</h1>
          <p className={styles.bannerSub}>
            {responses.length > 0
              ? `${responses.length} encuesta${responses.length > 1 ? 's' : ''} respondida${responses.length > 1 ? 's' : ''}`
              : 'Sin respuestas aún'}
          </p>
        </div>
        {responses.length > 0 && (
          <span className={styles.bannerBadge}>{responses.length}</span>
        )}
      </div>

      {/* Lista */}
      {responses.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIconWrap}>
            <History className={styles.emptyIcon} />
          </div>
          <p className={styles.emptyTitle}>Sin respuestas aún</p>
          <p className={styles.emptyDesc}>
            Cuando respondas una encuesta, aparecerá aquí tu historial.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {responses.map((r, i) => (
            <div key={r.id} className={styles.card}>
              <div className={styles.cardNum}>{i + 1}</div>
              <div className={styles.cardBody}>
                <p className={styles.cardTitle}>{r.survey.title}</p>
                <p className={styles.cardDate}>{formatDateTime(r.submittedAt)}</p>
              </div>
              <span className={styles.cardBadge}>
                <CheckCircle2 size={12} />
                Enviada
              </span>
            </div>
          ))}
        </div>
      )}

      <p className={styles.privacyNote}>Tus respuestas son privadas y confidenciales.</p>

    </div>
  );
}
