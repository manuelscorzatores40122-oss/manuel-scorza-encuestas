import { Info } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import styles from './respuestas.module.css';

export default async function AuxiliarRespuestas() {
  const [responses, total] = await Promise.all([
    prisma.response.findMany({
      include: {
        student: { include: { section: { include: { grade: true } } } },
        survey: true,
      },
      orderBy: { submittedAt: 'desc' },
      take: 200,
    }),
    prisma.response.count(),
  ]);

  return (
    <div className={styles.page}>

      <header className={styles.header}>
        <p className={styles.kick}>Panel · Auxiliar</p>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>Respuestas</h1>
            <p className={styles.pageSub}>Historial de encuestas completadas por los estudiantes</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={styles.totalBadge}>{total}</div>
            <div className={styles.totalLabel}>respuestas</div>
          </div>
        </div>
      </header>

      <div className={styles.body}>

        <div className={styles.notice}>
          <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          Las alertas de riesgo solo son visibles para el psicólogo. Si detectas algo preocupante, repórtalo directamente.
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Fecha</th>
                <th className={styles.th}>Estudiante</th>
                <th className={styles.th}>Grado · Sección</th>
                <th className={styles.th}>Encuesta</th>
              </tr>
            </thead>
            <tbody>
              {responses.map(r => (
                <tr key={r.id} className={styles.tr}>
                  <td className={`${styles.td} ${styles.tdDate}`} suppressHydrationWarning>
                    {formatDateTime(r.submittedAt)}
                  </td>
                  <td className={`${styles.td} ${styles.tdName}`}>
                    {r.student.apellidoPaterno} {r.student.apellidoMaterno}, {r.student.nombres}
                  </td>
                  <td className={`${styles.td} ${styles.tdGrade}`}>
                    {r.student.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'} {r.student.section.grade.name} · {r.student.section.name}
                  </td>
                  <td className={`${styles.td} ${styles.tdSurvey}`}>{r.survey.title}</td>
                </tr>
              ))}
              {responses.length === 0 && (
                <tr><td colSpan={4} className={styles.empty}>No hay respuestas registradas aún.</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
