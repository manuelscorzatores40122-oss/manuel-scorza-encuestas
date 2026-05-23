import Link from 'next/link';
import {
  Users,
  ClipboardList,
  AlertTriangle,
  FileText,
  Upload,
  ShieldAlert,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { DatabaseUnavailable } from '@/components/BaseDatosNoDisponible';
import styles from './page.module.css';

export default async function AdminDashboard() {
  try {
    const [
      totalStudents,
      totalUsers,
      totalSurveys,
      totalAlerts,
      activeRules,
      recentLogs,
      primaria,
      secundaria,
    ] = await Promise.all([
      prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.survey.count(),
      prisma.alert.count({ where: { reviewedAt: null } }),
      prisma.alertRule.count({ where: { isActive: true } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { user: { select: { fullName: true } } },
      }),
      prisma.student.count({
        where: { estadoMatricula: 'DEFINITIVA', section: { grade: { nivel: 'PRIMARIA' } } },
      }),
      prisma.student.count({
        where: { estadoMatricula: 'DEFINITIVA', section: { grade: { nivel: 'SECUNDARIA' } } },
      }),
    ]);

    return (
      <div className={styles.page}>

        {/* ── Encabezado ── */}
        <header className={styles.header}>
          <div>
            <p className={styles.kick}>Panel · Administrador</p>
            <h1 className={styles.pageTitle}>Resumen</h1>
            <p className={styles.pageDesc}>Vista general del sistema PsicoEscolar</p>
          </div>
        </header>

        {/* ── Stats ── */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconBlue}`}>
              <GraduationCap style={{ width: '1.1rem', height: '1.1rem' }} />
            </div>
            <p className={styles.statLabel}>Estudiantes</p>
            <p className={styles.statValue}>{totalStudents}</p>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconPurple}`}>
              <Users style={{ width: '1.1rem', height: '1.1rem' }} />
            </div>
            <p className={styles.statLabel}>Usuarios activos</p>
            <p className={styles.statValue}>{totalUsers}</p>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconGreen}`}>
              <ClipboardList style={{ width: '1.1rem', height: '1.1rem' }} />
            </div>
            <p className={styles.statLabel}>Encuestas</p>
            <p className={styles.statValue}>{totalSurveys}</p>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.iconRed}`}>
              <AlertTriangle style={{ width: '1.1rem', height: '1.1rem' }} />
            </div>
            <p className={styles.statLabel}>Alertas sin revisar</p>
            <p className={styles.statValue}>{totalAlerts}</p>
          </div>
        </div>

        {/* ── Fila inferior ── */}
        <div className={styles.bottomGrid}>

          {/* Distribución */}
          <div className={styles.card}>
            <p className={styles.cardTitle}>Distribución</p>
            <div className={styles.distGrid}>
              <div className={`${styles.distBox} ${styles.distBoxBlue}`}>
                <p className={styles.distBoxLabel}>Primaria</p>
                <p className={styles.distBoxValue}>{primaria}</p>
              </div>
              <div className={`${styles.distBox} ${styles.distBoxIndigo}`}>
                <p className={styles.distBoxLabel}>Secundaria</p>
                <p className={styles.distBoxValue}>{secundaria}</p>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className={styles.card}>
            <p className={styles.cardTitle}>Acciones rápidas</p>
            <div className={styles.actionsList}>
              <Link href="/admin/usuarios" className={styles.actionBtn}>
                <Users className={styles.actionIcon} />
                Gestionar usuarios
                <ChevronRight className={styles.actionArrow} />
              </Link>
              <Link href="/admin/importar" className={styles.actionBtn}>
                <Upload className={styles.actionIcon} />
                Importar SIAGIE
                <ChevronRight className={styles.actionArrow} />
              </Link>
              <Link href="/admin/reglas" className={styles.actionBtn}>
                <ShieldAlert className={styles.actionIcon} />
                Reglas de alerta ({activeRules} activas)
                <ChevronRight className={styles.actionArrow} />
              </Link>
              <Link href="/admin/auditoria" className={styles.actionBtn}>
                <FileText className={styles.actionIcon} />
                Ver auditoría
                <ChevronRight className={styles.actionArrow} />
              </Link>
            </div>
          </div>

          {/* Actividad reciente */}
          <div className={styles.card}>
            <p className={styles.cardTitle}>Actividad reciente</p>
            <div className={styles.logList}>
              {recentLogs.length === 0 && (
                <p className={styles.logEmpty}>Sin registros aún.</p>
              )}
              {recentLogs.map((l) => (
                <div key={l.id} className={styles.logItem}>
                  <span className={styles.logDot} />
                  <div>
                    <p className={styles.logAction}>{l.action}</p>
                    <p className={styles.logMeta}>
                      {l.user?.fullName || 'Sistema'} ·{' '}
                      {l.createdAt.toLocaleString('es-PE', {
                        day: '2-digit', month: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  } catch {
    return <DatabaseUnavailable />;
  }
}
