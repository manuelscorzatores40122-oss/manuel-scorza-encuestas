import Link from 'next/link';
import { AlertTriangle, AlertCircle, Check } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { DatabaseUnavailable } from '@/components/BaseDatosNoDisponible';
import { AccionesAlerta } from './AccionesAlerta';
import styles from './alertas.module.css';

export default async function AlertasPsicologo({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  try {
    return await renderPage(searchParams.tab || 'pendientes');
  } catch {
    return <DatabaseUnavailable />;
  }
}

async function renderPage(tab: string) {
  const where =
    tab === 'pendientes' ? { reviewedAt: null }
    : tab === 'revisadas' ? { reviewedAt: { not: null } }
    : {};

  const [pendCount, revCount, totalCount, alerts] = await Promise.all([
    prisma.alert.count({ where: { reviewedAt: null } }),
    prisma.alert.count({ where: { reviewedAt: { not: null } } }),
    prisma.alert.count(),
    prisma.alert.findMany({
      where,
      include: {
        rule: true,
        response: {
          include: {
            survey: { select: { title: true } },
            student: {
              select: {
                id: true,
                nombres: true,
                apellidoPaterno: true,
                section: { include: { grade: { select: { name: true, nivel: true } } } },
              },
            },
          },
        },
      },
      orderBy: { triggeredAt: 'desc' },
      take: 200,
    }),
  ]);

  const tabs = [
    { key: 'pendientes', label: 'Pendientes', count: pendCount },
    { key: 'revisadas',  label: 'Revisadas',  count: revCount },
    { key: 'todas',      label: 'Todas',       count: totalCount },
  ];

  return (
    <div className={styles.page}>

      {/* ── Encabezado + tabs ── */}
      <header className={styles.header}>
        <div className={styles.kick}>Seguimiento</div>
        <h1 className={styles.pageTitle}>Bandeja de alertas</h1>

        <div className={styles.tabs}>
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`?tab=${t.key}`}
              className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            >
              {t.label}
              <span className={styles.tabN}>{t.count}</span>
            </Link>
          ))}
        </div>
      </header>

      {/* ── Lista ── */}
      <div className={styles.body}>
        {alerts.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          alerts.map((a) => {
            const s      = a.response.student;
            const grade  = s.section.grade;
            const nivel  = grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria';
            const sev    = a.severity as 'HIGH' | 'MID';
            const isHigh = sev === 'HIGH';
            const done   = !!a.reviewedAt;

            return (
              <div
                key={a.id}
                className={`${styles.alert} ${done ? styles.alertDone : ''}`}
              >
                {/* Ícono severidad */}
                <div className={`${styles.sev} ${isHigh ? styles.sevHigh : styles.sevMid}`}>
                  {isHigh
                    ? <AlertTriangle />
                    : <AlertCircle />
                  }
                </div>

                {/* Contenido */}
                <div className={styles.aBody}>
                  <div className={styles.aTop}>
                    <span className={styles.aName}>
                      {s.apellidoPaterno}, {s.nombres}
                    </span>
                    <span className={`${styles.tag} ${isHigh ? styles.tagHigh : styles.tagMid}`}>
                      {isHigh ? 'Riesgo alto' : 'Riesgo medio'}
                    </span>
                  </div>

                  <div className={styles.aMeta}>
                    <b>{a.rule.name}</b> · {a.response.survey.title} · {nivel} {grade.name} {s.section.name} · {timeAgo(a.triggeredAt)}
                  </div>

                  {a.detail && (
                    <div className={styles.aText}>{a.detail}</div>
                  )}

                  {done && a.reviewedAt && (
                    <div className={styles.aMeta} style={{ marginTop: '8px' }}>
                      <Check style={{ display: 'inline', width: '12px', height: '12px', marginRight: '4px', color: '#1f5132' }} />
                      Revisada {timeAgo(a.reviewedAt)}
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <AccionesAlerta
                  alertId={a.id}
                  studentId={s.id}
                  isReviewed={done}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ── Estado vacío ── */
function EmptyState({ tab }: { tab: string }) {
  const messages: Record<string, [string, string]> = {
    pendientes: ['Sin alertas pendientes',   'Cuando una respuesta supere los umbrales de riesgo, la verás aquí para revisarla.'],
    revisadas:  ['Sin alertas revisadas',    'Las alertas que marques como revisadas aparecerán aquí.'],
    todas:      ['Sin alertas',              'No hay alertas registradas por el momento.'],
  };
  const [title, text] = messages[tab] ?? messages.todas;

  return (
    <div className={styles.empty}>
      <div className={styles.emptyIc}>
        <Check />
      </div>
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyText}>{text}</p>
    </div>
  );
}

/* ── Helper ── */
function timeAgo(date: Date): string {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (days  > 1) return `hace ${days}d`;
  if (days  === 1) return 'ayer';
  if (hours > 0) return `hace ${hours}h`;
  if (mins  > 1) return `hace ${mins}m`;
  return 'ahora';
}
