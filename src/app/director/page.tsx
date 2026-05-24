import { Users, TrendingUp, AlertTriangle, ClipboardCheck, Shield } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { GraficosDirector } from './GraficosDirector';
import { AcordeonHermanos, type SiblingGroup } from './AcordeonHermanos';
import styles from './dashboard.module.css';

type GradeRiskRow    = { grado: string; riskLevel: string; total: bigint };
type SiblingRow      = { total_familias: bigint; total_hermanos: bigint };
type SiblingDetailRow = {
  celular: string;
  apoderado: string;
  estudiante: string;
  grado: string;
  seccion: string;
  nivel: string;
};

export default async function DirectorDashboard() {
  const [
    totalEstudiantes,
    totalRespuestas,
    riesgoAlto,
    riesgoMedio,
    encuestasActivas,
    primaria,
    secundaria,
    porGradoRows,
    riskDist,
    siblingRows,
    siblingDetailRows,
  ] = await Promise.all([
    prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA' } }),
    prisma.response.count(),
    prisma.response.count({ where: { riskLevel: 'HIGH' } }),
    prisma.response.count({ where: { riskLevel: 'MID' } }),
    prisma.survey.count({ where: { isActive: true } }),
    prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA', section: { grade: { nivel: 'PRIMARIA' } } } }),
    prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA', section: { grade: { nivel: 'SECUNDARIA' } } } }),
    prisma.$queryRaw<GradeRiskRow[]>`
      SELECT
        CASE WHEN g.nivel = 'PRIMARIA' THEN 'Pri ' ELSE 'Sec ' END || g.name AS grado,
        r."riskLevel",
        COUNT(*) AS total
      FROM "Response" r
      INNER JOIN "Student" s ON s.id = r."studentId"
      INNER JOIN "Section" sec ON sec.id = s."sectionId"
      INNER JOIN "Grade" g ON g.id = sec."gradeId"
      GROUP BY g.nivel, g.name, g."order", r."riskLevel"
      ORDER BY g.nivel, g."order"
    `,
    prisma.response.groupBy({ by: ['riskLevel'], _count: true }),
    prisma.$queryRaw<SiblingRow[]>`
      WITH familias AS (
        SELECT celular, COUNT(DISTINCT "studentId") AS hijos
        FROM "Apoderado"
        WHERE celular IS NOT NULL AND celular <> ''
        GROUP BY celular
        HAVING COUNT(DISTINCT "studentId") >= 2
      )
      SELECT
        COUNT(*)                AS total_familias,
        COALESCE(SUM(hijos), 0) AS total_hermanos
      FROM familias
    `,
    prisma.$queryRaw<SiblingDetailRow[]>`
      SELECT DISTINCT ON (a.celular, s.id)
        a.celular,
        a."apellidosNombres"                                                   AS apoderado,
        s."apellidoPaterno" || ' ' || s."apellidoMaterno" || ', ' || s.nombres AS estudiante,
        g.name   AS grado,
        sec.name AS seccion,
        g.nivel
      FROM "Apoderado" a
      JOIN "Student"  s   ON s.id   = a."studentId"
      JOIN "Section"  sec ON sec.id = s."sectionId"
      JOIN "Grade"    g   ON g.id   = sec."gradeId"
      WHERE a.celular IN (
        SELECT celular FROM "Apoderado"
        WHERE celular IS NOT NULL AND celular <> ''
        GROUP BY celular
        HAVING COUNT(DISTINCT "studentId") >= 2
      )
      ORDER BY a.celular, s.id, a."apellidosNombres"
    `,
  ]);

  const totalFamilias = Number(siblingRows[0]?.total_familias ?? 0);
  const totalHermanos = Number(siblingRows[0]?.total_hermanos ?? 0);

  const siblingGroupMap: Record<string, SiblingGroup> = {};
  for (const row of siblingDetailRows) {
    if (!siblingGroupMap[row.celular]) {
      siblingGroupMap[row.celular] = { celular: row.celular, apoderado: row.apoderado, students: [] };
    }
    siblingGroupMap[row.celular].students.push({
      estudiante: row.estudiante,
      grado: row.grado,
      seccion: row.seccion,
      nivel: row.nivel,
    });
  }
  const siblingGroups = Object.values(siblingGroupMap).sort((a, b) =>
    a.apoderado.localeCompare(b.apoderado),
  );

  const byGrade: Record<string, { total: number; alto: number; medio: number }> = {};
  for (const row of porGradoRows) {
    const key = row.grado;
    const total = Number(row.total);
    byGrade[key] = byGrade[key] || { total: 0, alto: 0, medio: 0 };
    byGrade[key].total += total;
    if (row.riskLevel === 'HIGH') byGrade[key].alto += total;
    if (row.riskLevel === 'MID') byGrade[key].medio += total;
  }
  const gradeData = Object.entries(byGrade).sort().map(([grado, v]) => ({ grado, ...v }));

  const riskData = [
    { name: 'Sin riesgo',   value: riskDist.find(r => r.riskLevel === 'LOW')?._count  || 0, color: '#16a34a' },
    { name: 'Riesgo medio', value: riskDist.find(r => r.riskLevel === 'MID')?._count  || 0, color: '#c08a2e' },
    { name: 'Riesgo alto',  value: riskDist.find(r => r.riskLevel === 'HIGH')?._count || 0, color: '#b3473f' },
  ];

  const pctPri = totalEstudiantes > 0 ? ((primaria / totalEstudiantes) * 100).toFixed(0) : '0';
  const pctSec = totalEstudiantes > 0 ? ((secundaria / totalEstudiantes) * 100).toFixed(0) : '0';

  return (
    <div className={styles.page}>

      {/* ── Encabezado ── */}
      <header className={styles.header}>
        <p className={styles.kick}>Panel · Director</p>
        <h1 className={styles.pageTitle}>Resumen general</h1>
        <p className={styles.pageSub}>Estadísticas agregadas — sin identificación individual</p>
      </header>

      <div className={styles.body}>

        {/* ── KPIs ── */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpi}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconGreen}`}>
              <Users size={18} />
            </div>
            <div className={styles.kpiNum}>{totalEstudiantes}</div>
            <div className={styles.kpiLbl}>Estudiantes matriculados</div>
          </div>
          <div className={styles.kpi}>
            <div className={`${styles.kpiIcon}`}>
              <ClipboardCheck size={18} />
            </div>
            <div className={styles.kpiNum}>{totalRespuestas}</div>
            <div className={styles.kpiLbl}>Respuestas registradas</div>
          </div>
          <div className={styles.kpi}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconWarn}`}>
              <AlertTriangle size={18} />
            </div>
            <div className={`${styles.kpiNum} ${styles.kpiNumWarn}`}>{riesgoMedio}</div>
            <div className={styles.kpiLbl}>Riesgo medio</div>
          </div>
          <div className={styles.kpi}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconAlert}`}>
              <AlertTriangle size={18} />
            </div>
            <div className={`${styles.kpiNum} ${styles.kpiNumAlert}`}>{riesgoAlto}</div>
            <div className={styles.kpiLbl}>Riesgo alto</div>
          </div>
        </div>

        {/* ── Hermanos matriculados ── */}
        <AcordeonHermanos
          groups={siblingGroups}
          totalHermanos={totalHermanos}
          totalFamilias={totalFamilias}
        />

        {/* ── Gráficos ── */}
        <div className={styles.charts}>

          {/* Población */}
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Población estudiantil</h2>
            <p className={styles.chartDesc}>Distribución por nivel educativo</p>

            <div className={styles.popGrid}>
              <div className={styles.popItem}>
                <div className={styles.popLabel}>Primaria</div>
                <div className={`${styles.popNum} ${styles.popNumPri}`}>{primaria}</div>
                <div className={styles.popPct}>{pctPri}% del total</div>
              </div>
              <div className={styles.popItem}>
                <div className={styles.popLabel}>Secundaria</div>
                <div className={`${styles.popNum} ${styles.popNumSec}`}>{secundaria}</div>
                <div className={styles.popPct}>{pctSec}% del total</div>
              </div>
            </div>

            <div className={styles.encuestasNote}>
              <TrendingUp size={14} />
              {encuestasActivas} encuesta{encuestasActivas !== 1 ? 's' : ''} activa{encuestasActivas !== 1 ? 's' : ''} en este momento
            </div>
          </div>

          {/* Gráfico riesgo */}
          <GraficosDirector riskData={riskData} gradeData={gradeData} />
        </div>

        {/* ── Privacidad ── */}
        <div className={styles.privacy}>
          <span className={styles.privacyIcon}><Shield size={16} /></span>
          Por confidencialidad, no se muestran datos individuales de estudiantes.
          Para casos específicos, coordina con el psicólogo del colegio.
        </div>

      </div>
    </div>
  );
}
