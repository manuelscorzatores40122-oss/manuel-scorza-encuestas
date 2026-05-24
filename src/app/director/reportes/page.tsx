import { prisma } from '@/lib/prisma';
import styles from './reportes.module.css';

export default async function ReportesDirector() {
  const [surveys, totalsByLevel] = await Promise.all([
    prisma.survey.findMany({
      include: { _count: { select: { responses: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.response.groupBy({ by: ['riskLevel'], _count: true }),
  ]);

  const sinRiesgo  = totalsByLevel.find(t => t.riskLevel === 'LOW')?._count  || 0;
  const riesgoMed  = totalsByLevel.find(t => t.riskLevel === 'MID')?._count  || 0;
  const riesgoAlto = totalsByLevel.find(t => t.riskLevel === 'HIGH')?._count || 0;

  return (
    <div className={styles.page}>

      <header className={styles.header}>
        <p className={styles.kick}>Panel · Director</p>
        <h1 className={styles.pageTitle}>Reportes</h1>
        <p className={styles.pageSub}>Participación y riesgo agregado por encuesta</p>
      </header>

      <div className={styles.body}>

        {/* ── Tabla de encuestas ── */}
        <div className={styles.section}>
          <div className={styles.sectHead}>
            <h2 className={styles.sectTitle}>Encuestas y participación</h2>
            <span className={styles.sectCount}>{surveys.length} encuestas</span>
          </div>

          {surveys.length === 0 ? (
            <div className={styles.empty}>Sin encuestas registradas aún.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Encuesta</th>
                    <th className={styles.th}>Estado</th>
                    <th className={`${styles.th} ${styles.thR}`}>Respuestas</th>
                  </tr>
                </thead>
                <tbody>
                  {surveys.map(s => (
                    <tr key={s.id} className={styles.tr}>
                      <td className={`${styles.td} ${styles.tdTitle}`}>{s.title}</td>
                      <td className={styles.td}>
                        {s.isActive ? (
                          <span className={styles.stateOn}>
                            <span className={styles.stateDot} style={{ background: '#16a34a' }} />
                            Activa
                          </span>
                        ) : (
                          <span className={styles.stateOff}>
                            <span className={styles.stateDot} style={{ background: '#8a9089' }} />
                            Cerrada
                          </span>
                        )}
                      </td>
                      <td className={`${styles.td} ${styles.tdNum}`}>{s._count.responses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Resumen de riesgo global */}
          <div className={styles.riskGrid}>
            <div className={styles.riskCard}>
              <div className={styles.riskLabel}>Sin riesgo</div>
              <div className={`${styles.riskNum} ${styles.riskLow}`}>{sinRiesgo}</div>
            </div>
            <div className={styles.riskCard}>
              <div className={styles.riskLabel}>Riesgo medio</div>
              <div className={`${styles.riskNum} ${styles.riskMid}`}>{riesgoMed}</div>
            </div>
            <div className={styles.riskCard}>
              <div className={styles.riskLabel}>Riesgo alto</div>
              <div className={`${styles.riskNum} ${styles.riskHigh}`}>{riesgoAlto}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
