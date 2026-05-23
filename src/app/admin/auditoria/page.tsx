import { prisma }     from '@/lib/prisma';
import { AutoRefresh } from './AutoRefresh';
import styles          from './page.module.css';

const PAGE = 10;

// ── Metadatos por acción ─────────────────────────────────────────
const ACTION_META: Record<string, { label: string; bg: string; color: string }> = {
  LOGIN:               { label: 'Ingreso',         bg: '#e1f5ee', color: '#0f6e56' },
  LOGOUT:              { label: 'Salida',           bg: '#f7f6f1', color: '#8a887f' },
  CREATE_USER:         { label: 'Nuevo usuario',    bg: '#e6f1fb', color: '#185fa5' },
  ACTIVATE_USER:       { label: 'Activó usuario',   bg: '#e1f5ee', color: '#0f6e56' },
  DEACTIVATE_USER:     { label: 'Desactivó user',   bg: '#fef2f2', color: '#c0392b' },
  RESET_PASSWORD:      { label: 'Reseteo clave',    bg: '#fefce8', color: '#b45309' },
  IMPORT_SIAGIE:       { label: 'Importó SIAGIE',   bg: '#f3f0ff', color: '#6d28d9' },
  IMPORT_GENERAL:      { label: 'Importó alumnos',  bg: '#f3f0ff', color: '#6d28d9' },
  CREATE_SURVEY:       { label: 'Nueva encuesta',   bg: '#e6f1fb', color: '#185fa5' },
  UPDATE_SURVEY:       { label: 'Editó encuesta',   bg: '#fefce8', color: '#b45309' },
  DELETE_SURVEY:       { label: 'Eliminó encuesta', bg: '#fef2f2', color: '#c0392b' },
  CREATE_ANNOUNCEMENT: { label: 'Nuevo anuncio',    bg: '#e1f5ee', color: '#0f6e56' },
  REVIEW_ALERT:        { label: 'Revisó alerta',    bg: '#fff4ed', color: '#c2410c' },
};

function ActionChip({ action }: { action: string }) {
  const m = ACTION_META[action] ?? { label: action, bg: '#f7f6f1', color: '#8a887f' };
  return <span className={styles.chip} style={{ background: m.bg, color: m.color }}>{m.label}</span>;
}

function RiskChip({ level }: { level: string }) {
  const cls = level === 'HIGH' ? styles.riskHigh : level === 'MID' ? styles.riskMid : styles.riskLow;
  const labels: Record<string, string> = { LOW: 'Bajo', MID: 'Medio', HIGH: 'Alto' };
  return <span className={cls}>{labels[level] ?? level}</span>;
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60)    return `hace ${s}s`;
  if (s < 3600)  return `hace ${Math.floor(s / 60)}min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)}h`;
  return `hace ${Math.floor(s / 86400)}d`;
}

const fmtTime = (d: Date) =>
  d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtFull = (d: Date) =>
  d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

function Pagination({
  page, total, paramName, other,
}: {
  page: number; total: number; paramName: string;
  other: Record<string, string>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE));

  function url(p: number) {
    const params = new URLSearchParams(other);
    params.set(paramName, String(p));
    return `/admin/auditoria?${params.toString()}`;
  }

  return (
    <div className={styles.pagination}>
      <span className={styles.pgInfo}>
        Página {page} de {totalPages} · {total} registros
      </span>
      <div className={styles.pgBtns}>
        {page > 1
          ? <a href={url(page - 1)} className={styles.pgBtn}>← Anterior</a>
          : <span className={styles.pgBtnDisabled}>← Anterior</span>}
        {page < totalPages
          ? <a href={url(page + 1)} className={styles.pgBtn}>Siguiente →</a>
          : <span className={styles.pgBtnDisabled}>Siguiente →</span>}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: { logPage?: string; respPage?: string };
}) {
  const logPage  = Math.max(1, Number(searchParams.logPage  || 1));
  const respPage = Math.max(1, Number(searchParams.respPage || 1));

  const [logs, logTotal, responses, respTotal] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: PAGE,
      skip: (logPage - 1) * PAGE,
      include: { user: { select: { fullName: true } } },
    }),
    prisma.auditLog.count(),
    prisma.response.findMany({
      orderBy: { submittedAt: 'desc' },
      take: PAGE,
      skip: (respPage - 1) * PAGE,
      include: {
        student: {
          select: {
            nombres: true,
            apellidoPaterno: true,
            section: { include: { grade: { select: { name: true, nivel: true } } } },
          },
        },
        survey: { select: { title: true } },
      },
    }),
    prisma.response.count(),
  ]);

  return (
    <div className={styles.page}>

      {/* ── Encabezado ── */}
      <header className={styles.head}>
        <div>
          <p className={styles.kicker}>Panel · Administrador</p>
          <h1 className={styles.title}>Auditoría</h1>
        </div>
        <AutoRefresh />
      </header>
      <div className={styles.rule} />

      {/* ══ Respuestas de encuestas ══ */}
      <section className={styles.section}>
        <div className={styles.sectHead}>
          <span className={styles.sectTitle}>Respuestas recientes · encuestas</span>
          <span className={styles.sectCount}>{respTotal} total</span>
        </div>

        <div className={styles.tableWrap}>
          {respTotal === 0 ? (
            <p className={styles.empty}>Sin respuestas aún.</p>
          ) : (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {['Hora', 'Alumno', 'Grado · Sec', 'Encuesta', 'Riesgo', 'Score'].map(h => (
                      <th key={h} className={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {responses.map(r => {
                    const nombre = `${r.student.apellidoPaterno} ${r.student.nombres}`;
                    const grado  = `${r.student.section.grade.nivel === 'PRIMARIA' ? 'P' : 'S'}${r.student.section.grade.name} · ${r.student.section.name}`;
                    return (
                      <tr key={r.id} className={styles.tr}>
                        <td className={`${styles.td} ${styles.tdTime}`}>
                          <div className={styles.timeMain}>{fmtTime(r.submittedAt)}</div>
                          <div className={styles.timeSub}>{timeAgo(r.submittedAt)}</div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.nameMain}>{nombre}</div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.nameSub} style={{ color: '#52514c' }}>{grado}</div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.surveyCell}>{r.survey.title}</div>
                        </td>
                        <td className={styles.td}><RiskChip level={r.riskLevel} /></td>
                        <td className={styles.td}><span className={styles.score}>{r.riskScore}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination
                page={respPage}
                total={respTotal}
                paramName="respPage"
                other={searchParams.logPage ? { logPage: searchParams.logPage } : {}}
              />
            </>
          )}
        </div>
      </section>

      {/* ══ Actividad del sistema ══ */}
      <section className={styles.section}>
        <div className={styles.sectHead}>
          <span className={styles.sectTitle}>Actividad del sistema</span>
          <span className={styles.sectCount}>{logTotal} total</span>
        </div>

        <div className={styles.tableWrap}>
          {logTotal === 0 ? (
            <p className={styles.empty}>Sin registros.</p>
          ) : (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {['Hora', 'Usuario', 'Acción', 'Detalle'].map(h => (
                      <th key={h} className={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => {
                    const meta    = typeof l.metadata === 'object' && l.metadata !== null ? l.metadata as Record<string, any> : {};
                    const detalle = Object.entries(meta)
                      .filter(([k]) => !['ip', 'userAgent'].includes(k))
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ')
                      .slice(0, 70) || l.entity || '—';

                    return (
                      <tr key={l.id} className={styles.tr}>
                        <td className={`${styles.td} ${styles.tdTime}`}>
                          <div className={styles.timeMain}>{fmtTime(l.createdAt)}</div>
                          <div className={styles.timeSub}>{fmtFull(l.createdAt)}</div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.nameMain}>
                            {l.user?.fullName || <span style={{ color: '#8a887f' }}>Sistema</span>}
                          </div>
                        </td>
                        <td className={styles.td}><ActionChip action={l.action} /></td>
                        <td className={styles.td}><span className={styles.detail}>{detalle}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination
                page={logPage}
                total={logTotal}
                paramName="logPage"
                other={searchParams.respPage ? { respPage: searchParams.respPage } : {}}
              />
            </>
          )}
        </div>
      </section>

    </div>
  );
}
