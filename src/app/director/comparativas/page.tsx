import { prisma } from '@/lib/prisma';
import { GraficosComparativas } from './GraficosComparativas';
import styles from './comparativas.module.css';

export default async function ComparativasDirector() {
  const responses = await prisma.response.findMany({
    include: { student: { include: { section: { include: { grade: true } } } } },
  });

  const data: Record<string, { nivel: string; total: number; alto: number; medio: number; bajo: number }> = {
    PRIMARIA:   { nivel: 'Primaria',   total: 0, alto: 0, medio: 0, bajo: 0 },
    SECUNDARIA: { nivel: 'Secundaria', total: 0, alto: 0, medio: 0, bajo: 0 },
  };

  for (const r of responses) {
    const n = r.student.section.grade.nivel;
    data[n].total++;
    if (r.riskLevel === 'HIGH') data[n].alto++;
    else if (r.riskLevel === 'MID') data[n].medio++;
    else data[n].bajo++;
  }

  const compareData = Object.values(data);

  return (
    <div className={styles.page}>

      <header className={styles.header}>
        <p className={styles.kick}>Panel · Director</p>
        <h1 className={styles.pageTitle}>Comparativas</h1>
        <p className={styles.pageSub}>Primaria vs. Secundaria — datos completamente anonimizados</p>
      </header>

      <div className={styles.body}>

        {/* ── Cards de nivel ── */}
        <div className={styles.compareGrid}>
          {compareData.map((d) => {
            const isPri = d.nivel === 'Primaria';
            return (
              <div key={d.nivel} className={styles.compareCard}>
                <div className={styles.compareLabel}>
                  <span className={isPri ? styles.dotPri : styles.dotSec} />
                  {d.nivel}
                </div>
                <div className={`${styles.compareNum} ${isPri ? styles.numPri : styles.numSec}`}>
                  {d.total}
                </div>
                <div className={styles.riskRow}>
                  <div className={styles.riskItem}>
                    <span className={styles.riskName}>
                      <span className={styles.riskDot} style={{ background: '#16a34a' }} />
                      Sin riesgo
                    </span>
                    <span className={styles.riskVal}>{d.bajo}</span>
                  </div>
                  <div className={styles.riskItem}>
                    <span className={styles.riskName}>
                      <span className={styles.riskDot} style={{ background: '#c08a2e' }} />
                      Riesgo medio
                    </span>
                    <span className={styles.riskVal}>{d.medio}</span>
                  </div>
                  <div className={styles.riskItem}>
                    <span className={styles.riskName}>
                      <span className={styles.riskDot} style={{ background: '#b3473f' }} />
                      Riesgo alto
                    </span>
                    <span className={styles.riskVal}>{d.alto}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Gráfico ── */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Distribución comparada</h2>
          <p className={styles.chartDesc}>Respuestas por nivel y nivel de riesgo</p>
          <GraficosComparativas data={compareData} />
        </div>

      </div>
    </div>
  );
}
