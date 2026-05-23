import Link from 'next/link';
import {
  Users, ClipboardList, AlertTriangle, FileText, Upload,
  ShieldAlert, ChevronRight, LogIn, LogOut, Bell, MoreHorizontal,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { DatabaseUnavailable } from '@/components/BaseDatosNoDisponible';
import styles from './page.module.css';

const ACTION_LABELS: Record<string, string> = {
  LOGIN:               'Inicio de sesión',
  LOGOUT:              'Cierre de sesión',
  CREATE_USER:         'Nuevo usuario creado',
  ACTIVATE_USER:       'Usuario activado',
  DEACTIVATE_USER:     'Usuario desactivado',
  RESET_PASSWORD:      'Contraseña restablecida',
  IMPORT_SIAGIE:       'Importación SIAGIE',
  IMPORT_GENERAL:      'Importación de alumnos',
  CREATE_SURVEY:       'Encuesta creada',
  UPDATE_SURVEY:       'Encuesta editada',
  DELETE_SURVEY:       'Encuesta eliminada',
  CREATE_ANNOUNCEMENT: 'Anuncio publicado',
  REVIEW_ALERT:        'Alerta revisada',
};

function ActionIcon({ action }: { action: string }) {
  const p = { style: { width: 16, height: 16 }, strokeWidth: 1.6 } as const;
  if (action === 'LOGIN')               return <LogIn  {...p} />;
  if (action === 'LOGOUT')              return <LogOut {...p} />;
  if (action.includes('USER'))          return <Users  {...p} />;
  if (action.includes('SURVEY'))        return <ClipboardList {...p} />;
  if (action.includes('IMPORT'))        return <Upload {...p} />;
  if (action === 'CREATE_ANNOUNCEMENT') return <Bell   {...p} />;
  if (action === 'REVIEW_ALERT')        return <AlertTriangle {...p} />;
  return <MoreHorizontal {...p} />;
}

export default async function AdminDashboard() {
  try {
    const [
      totalStudents, totalUsers, totalSurveys, totalAlerts,
      activeRules, recentLogs, primaria, secundaria,
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
      prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA', section: { grade: { nivel: 'PRIMARIA'    } } } }),
      prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA', section: { grade: { nivel: 'SECUNDARIA' } } } }),
    ]);

    const now       = new Date();
    const updated   = now.toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const year      = now.getFullYear();
    const pct       = (n: number) => totalStudents > 0 ? Math.round(n / totalStudents * 1000) / 10 : 0;

    return (
      <div className={styles.page}>

        {/* ── Encabezado ── */}
        <header className={styles.head}>
          <div>
            <p className={styles.kicker}>PsicoEscolar · Panel del administrador</p>
            <h1 className={styles.title}>Resumen general</h1>
          </div>
          <div className={styles.headMeta}>
            <div>Año escolar {year}</div>
            <div>Actualizado {updated}</div>
          </div>
        </header>
        <div className={styles.rule} />

        {/* ── Métricas ── */}
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <div className={styles.metricLab}>Estudiantes</div>
            <div className={styles.metricVal}>{totalStudents}</div>
            <div className={styles.metricSub}>en padrón activo</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLab}>Usuarios activos</div>
            <div className={styles.metricVal}>{totalUsers}</div>
            <div className={styles.metricSub}>con acceso vigente</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLab}>Encuestas</div>
            <div className={styles.metricVal}>{totalSurveys}</div>
            <div className={styles.metricSub}>en aplicación</div>
          </div>
          <div className={`${styles.metric} ${totalAlerts === 0 ? styles.metricOk : styles.metricDanger}`}>
            <div className={styles.metricLab}>Alertas sin revisar</div>
            <div className={styles.metricVal}>
              {totalAlerts}
              {totalAlerts === 0 && <span className={styles.metricTag}>Al día</span>}
            </div>
            <div className={styles.metricSub}>
              {totalAlerts === 0 ? 'sin pendientes' : `${totalAlerts} pendiente${totalAlerts !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>

        {/* ── Dos columnas ── */}
        <div className={styles.cols}>

          {/* Izquierda: distribución + acciones */}
          <div>
            <div className={styles.sectHead}>
              <span className={styles.sectTitle}>Distribución por nivel</span>
              <span className={styles.sectMeta}>{totalStudents} estudiantes</span>
            </div>

            <div className={styles.distRow}>
              <div className={styles.distTop}>
                <span className={styles.distName}>Primaria</span>
                <span className={styles.distNum}>{primaria} · {pct(primaria)} %</span>
              </div>
              <div className={styles.track}>
                <span className={styles.trackFill} style={{ width: `${pct(primaria)}%`, background: '#185fa5' }} />
              </div>
            </div>

            <div className={styles.distRow}>
              <div className={styles.distTop}>
                <span className={styles.distName}>Secundaria</span>
                <span className={styles.distNum}>{secundaria} · {pct(secundaria)} %</span>
              </div>
              <div className={styles.track}>
                <span className={styles.trackFill} style={{ width: `${pct(secundaria)}%`, background: '#5f5e5a' }} />
              </div>
            </div>

            <div className={styles.actionsSect}>
              <div className={`${styles.sectHead} ${styles.sectHeadFlush}`}>
                <span className={styles.sectTitle}>Acciones administrativas</span>
              </div>

              <Link href="/admin/usuarios" className={styles.actionRow}>
                <span className={styles.actionLeft}>
                  <Users style={{ width: 17, height: 17 }} strokeWidth={1.6} />
                  Gestionar usuarios
                </span>
                <ChevronRight className={styles.actionChev} strokeWidth={1.6} />
              </Link>

              <Link href="/admin/importar" className={styles.actionRow}>
                <span className={styles.actionLeft}>
                  <Upload style={{ width: 17, height: 17 }} strokeWidth={1.6} />
                  Importar / Exportar alumnos
                </span>
                <ChevronRight className={styles.actionChev} strokeWidth={1.6} />
              </Link>

              <Link href="/admin/reglas" className={styles.actionRow}>
                <span className={styles.actionLeft}>
                  <ShieldAlert style={{ width: 17, height: 17 }} strokeWidth={1.6} />
                  Reglas de alerta
                </span>
                <span className={styles.actionRight}>
                  <span className={styles.actionCount}>{activeRules} activas</span>
                  <ChevronRight className={styles.actionChev} strokeWidth={1.6} />
                </span>
              </Link>

              <Link href="/admin/auditoria" className={styles.actionRow}>
                <span className={styles.actionLeft}>
                  <FileText style={{ width: 17, height: 17 }} strokeWidth={1.6} />
                  Ver auditoría
                </span>
                <ChevronRight className={styles.actionChev} strokeWidth={1.6} />
              </Link>
            </div>
          </div>

          {/* Derecha: actividad reciente */}
          <div>
            <div className={styles.sectHead}>
              <span className={styles.sectTitle}>Actividad reciente</span>
              <Link href="/admin/auditoria" className={styles.sectLink}>Ver registro</Link>
            </div>

            {recentLogs.length === 0 ? (
              <p className={styles.emptyMsg}>Sin registros aún.</p>
            ) : (
              <table className={styles.actTable}>
                <tbody>
                  {recentLogs.map(l => (
                    <tr key={l.id} className={styles.actRow}>
                      <td className={`${styles.actTd} ${styles.actTdIc}`}>
                        <ActionIcon action={l.action} />
                      </td>
                      <td className={styles.actTd}>
                        <div className={styles.actWho}>{l.user?.fullName || 'Sistema'}</div>
                        <div className={styles.actWhat}>{ACTION_LABELS[l.action] ?? l.action}</div>
                      </td>
                      <td className={`${styles.actTd} ${styles.actTdTime}`}>
                        {l.createdAt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    );
  } catch {
    return <DatabaseUnavailable />;
  }
}
