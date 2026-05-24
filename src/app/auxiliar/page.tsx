import Link from 'next/link';
import { Users, FileBarChart, ClipboardCheck, Info } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import styles from './dashboard.module.css';

export default async function AuxiliarHome() {
  const [totalStudents, totalResponses, totalSurveys] = await Promise.all([
    prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA' } }),
    prisma.response.count(),
    prisma.survey.count({ where: { isActive: true } }),
  ]);

  return (
    <div className={styles.page}>

      <header className={styles.header}>
        <p className={styles.kick}>Panel · Auxiliar</p>
        <h1 className={styles.pageTitle}>Inicio</h1>
        <p className={styles.pageSub}>Información general de estudiantes y participación</p>
      </header>

      <div className={styles.body}>

        {/* ── KPIs ── */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpi}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconGreen}`}>
              <Users size={18} />
            </div>
            <div className={styles.kpiNum}>{totalStudents}</div>
            <div className={styles.kpiLbl}>Estudiantes matriculados</div>
          </div>
          <div className={styles.kpi}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconPurple}`}>
              <FileBarChart size={18} />
            </div>
            <div className={styles.kpiNum}>{totalResponses}</div>
            <div className={styles.kpiLbl}>Respuestas registradas</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiIcon}>
              <ClipboardCheck size={18} />
            </div>
            <div className={styles.kpiNum}>{totalSurveys}</div>
            <div className={styles.kpiLbl}>Encuestas activas</div>
          </div>
        </div>

        {/* ── Accesos rápidos ── */}
        <div className={styles.navGrid}>
          <Link href="/auxiliar/estudiantes" className={styles.navCard}>
            <div className={styles.navCardIcon}><Users size={20} /></div>
            <p className={styles.navCardTitle}>Estudiantes</p>
            <p className={styles.navCardSub}>Busca por nombre, DNI, grado o sección</p>
          </Link>
          <Link href="/auxiliar/respuestas" className={styles.navCard}>
            <div className={styles.navCardIcon}><FileBarChart size={20} /></div>
            <p className={styles.navCardTitle}>Respuestas</p>
            <p className={styles.navCardSub}>Historial de encuestas completadas</p>
          </Link>
        </div>

        {/* ── Nota de privacidad ── */}
        <div className={styles.notice}>
          <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          Como auxiliar puedes ver las respuestas de todos los estudiantes pero no las alertas de riesgo.
          Si detectas algún caso preocupante, comunícalo al psicólogo.
        </div>

      </div>
    </div>
  );
}
