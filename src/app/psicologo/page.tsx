// src/app/psicologo/page.tsx

import Link from 'next/link';
import {
  AlertTriangle,
  ClipboardList,
  Users,
  TrendingUp,
  Megaphone,
  Plus,
} from 'lucide-react';

import { prisma } from '@/lib/prisma';
import { GraficosDashboard } from './GraficosDashboard';
import { BuscadorEstudiantes } from './BuscadorEstudiantes';
import { DatabaseUnavailable } from '@/components/BaseDatosNoDisponible';
import styles from './dashboard.module.css';

export default async function PsicologoDashboard() {
  try {
    return await renderDashboard();
  } catch {
    return <DatabaseUnavailable />;
  }
}

async function renderDashboard() {
  const [
    totalEstudiantes,
    encuestasActivas,
    totalRespuestas,
    alertasPendientes,
    respuestasPorRiesgo,
    respuestasUltimos30,
    anunciosPublicados,
    ultimasAlertas,
    respuestasTodas,
  ] = await Promise.all([
    prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA' } }),
    prisma.survey.count({ where: { isActive: true } }),
    prisma.response.count(),
    prisma.alert.count({ where: { reviewedAt: null } }),
    prisma.response.groupBy({ by: ['riskLevel'], _count: true }),
    prisma.response.findMany({
      where: { submittedAt: { gte: daysAgo(30) } },
      select: { submittedAt: true, riskLevel: true },
    }),
    prisma.announcement.count({ where: { isPublished: true } }),
    prisma.alert.findMany({
      where: { reviewedAt: null },
      orderBy: { triggeredAt: 'desc' },
      take: 6,
      select: {
        id: true,
        severity: true,
        triggeredAt: true,
        response: {
          select: {
            riskLevel: true,
            survey: { select: { title: true } },
            student: { select: { nombres: true, apellidoPaterno: true } },
          },
        },
      },
    }),
    prisma.response.findMany({
      select: {
        riskLevel: true,
        student: {
          select: {
            section: {
              select: {
                grade: { select: { name: true, order: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const riskDist = {
    LOW:  respuestasPorRiesgo.find((r) => r.riskLevel === 'LOW')?._count  || 0,
    MID:  respuestasPorRiesgo.find((r) => r.riskLevel === 'MID')?._count  || 0,
    HIGH: respuestasPorRiesgo.find((r) => r.riskLevel === 'HIGH')?._count || 0,
  };

  const trend       = bucketByDay(respuestasUltimos30, 30);
  const riskByGrade = buildRiskByGrade(respuestasTodas);

  const tasaRespuesta = totalEstudiantes > 0
    ? `${Math.round((totalRespuestas / totalEstudiantes) * 100)}%`
    : '0%';

  return (
    <div className={styles.page}>

      {/* ── Encabezado ─────────────────────── */}
      <header className={styles.header}>
        <div>
          <div className={styles.kick}>Panel del psicólogo</div>
          <h1 className={styles.pageTitle}>Resumen de bienestar</h1>
          <p className={styles.pageSubtitle}>Institución Educativa 40122 Manuel Scorza Torres</p>
        </div>
        <Link href="/psicologo/encuestas/nueva" className={styles.btnPrimary}>
          <Plus className={styles.btnPrimaryIcon} />
          Nueva encuesta
        </Link>
      </header>

      <div className={styles.body}>

        {/* ── Buscador ───────────────────── */}
        <BuscadorEstudiantes />

        {/* ── KPIs: requiere atención ────── */}
        <p className={styles.sectionLabel}>Busquedas rapidas</p>
        <p></p>

        <div className={styles.kpiGrid}>
          <KpiCell
            icon={<AlertTriangle className={styles.kpiTopIcon} />}
            alert
            label="Alertas pendientes"
            value={alertasPendientes}
            meta={alertasPendientes === 0 ? 'Todo en orden' : undefined}
            link={alertasPendientes > 0 ? { href: '/psicologo/alertas', text: 'Revisar ahora →' } : undefined}
          />
          <KpiCell
            icon={<ClipboardList className={styles.kpiTopIcon} />}
            label="Encuestas activas"
            value={encuestasActivas}
            link={{ href: '/psicologo/encuestas/nueva', text: 'Lanzar una →' }}
          />
          <KpiCell
            icon={<TrendingUp className={styles.kpiTopIcon} />}
            label="Respuestas recibidas"
            value={totalRespuestas}
            link={totalRespuestas > 0 ? { href: '/psicologo/respuestas', text: 'Ver respuestas →' } : undefined}
          />
        </div>

        {/* ── Contexto general ───────────── */}
        <p className={styles.sectionLabel}>Contexto general</p>
        <div className={styles.ctxGrid}>
          <CtxCell icon={<Users />}      label="Estudiantes"       value={totalEstudiantes} />
          <CtxCell icon={<Megaphone />}  label="Anuncios"          value={anunciosPublicados} />
          <CtxCell icon={<TrendingUp />} label="Tasa de respuesta" value={tasaRespuesta} />
        </div>

        {/* ── Analítica ──────────────────── */}
        <div className={styles.secBar}>
          <h2 className={styles.secBarTitle}>Analítica</h2>
          <Link href="/psicologo/estadisticas" className={styles.linkArrow}>
            Ver estadísticas completas →
          </Link>
        </div>
        <GraficosDashboard riskDist={riskDist} trend={trend} riskByGrade={riskByGrade} />

        {/* ── Alertas recientes ──────────── */}
        <div className={styles.alertsHead}>
          <h2 className={styles.alertsTitle}>Alertas recientes</h2>
          <Link href="/psicologo/alertas" className={styles.linkArrow}>Ver todas →</Link>
        </div>
        {ultimasAlertas.length === 0 ? (
          <p className={styles.alertEmpty}>No hay alertas pendientes.</p>
        ) : (
          <div className={styles.alertList}>
            {ultimasAlertas.map((a) => {
              const level      = a.response.riskLevel as 'LOW' | 'MID' | 'HIGH';
              const dotClass   = level === 'HIGH' ? styles.alertDotHigh : level === 'MID' ? styles.alertDotMid : styles.alertDotLow;
              const badgeClass = level === 'HIGH' ? styles.alertBadgeHigh : level === 'MID' ? styles.alertBadgeMid : styles.alertBadgeLow;
              const badgeText  = level === 'HIGH' ? 'ALTO' : level === 'MID' ? 'MEDIO' : 'BAJO';
              return (
                <Link key={a.id} href="/psicologo/alertas" className={styles.alertRow}>
                  <span className={`${styles.alertDot} ${dotClass}`} />
                  <span className={styles.alertName}>
                    {a.response.student.apellidoPaterno}, {a.response.student.nombres}
                  </span>
                  <span className={styles.alertSurvey}>{a.response.survey.title}</span>
                  <span className={`${styles.alertBadge} ${badgeClass}`}>{badgeText}</span>
                  <span className={styles.alertTime}>{timeAgo(a.triggeredAt)}</span>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

/* ── Componentes internos ────────────────── */

function KpiCell({
  icon,
  alert,
  label,
  value,
  meta,
  link,
}: {
  icon: React.ReactNode;
  alert?: boolean;
  label: string;
  value: number;
  meta?: string;
  link?: { href: string; text: string };
}) {
  return (
    <div className={`${styles.kpi} ${alert ? styles.kpiAlert : ''}`}>
      <div className={styles.kpiTop}>
        {icon}
        {label}
      </div>
      <div className={styles.kpiNum}>{value}</div>
      <div className={styles.kpiMeta}>
        {meta ?? (link && (
          <Link href={link.href} className={styles.kpiLink}>{link.text}</Link>
        ))}
      </div>
    </div>
  );
}

function CtxCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className={styles.ctxItem}>
      <div className={styles.ctxLabel}>
        {icon}
        {label}
      </div>
      <div className={styles.ctxValue}>{value}</div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────── */

function timeAgo(date: Date): string {
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (days  > 0) return `hace ${days}d`;
  if (hours > 0) return `hace ${hours}h`;
  if (mins  > 1) return `hace ${mins}m`;
  return 'ahora';
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function bucketByDay(
  items: { submittedAt: Date; riskLevel: string }[],
  days: number
) {
  type Bucket = { fecha: string; total: number; low: number; mid: number; high: number };
  const buckets: Bucket[] = [];
  const byFecha = new Map<string, Bucket>();
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(5, 10);
    const bucket: Bucket = { fecha: key, total: 0, low: 0, mid: 0, high: 0 };
    buckets.push(bucket);
    byFecha.set(key, bucket);
  }

  for (const item of items) {
    const key = item.submittedAt.toISOString().slice(5, 10);
    const bucket = byFecha.get(key);
    if (!bucket) continue;
    bucket.total++;
    if (item.riskLevel === 'LOW')       bucket.low++;
    else if (item.riskLevel === 'MID')  bucket.mid++;
    else if (item.riskLevel === 'HIGH') bucket.high++;
  }

  return buckets;
}

function buildRiskByGrade(
  items: {
    riskLevel: string;
    student: { section: { grade: { name: string; order: number } } };
  }[]
) {
  type GradeBucket = { grade: string; order: number; LOW: number; MID: number; HIGH: number };
  const map = new Map<string, GradeBucket>();

  for (const item of items) {
    const { name, order } = item.student.section.grade;
    if (!map.has(name)) {
      map.set(name, { grade: name, order, LOW: 0, MID: 0, HIGH: 0 });
    }
    const b = map.get(name)!;
    if (item.riskLevel === 'LOW')       b.LOW++;
    else if (item.riskLevel === 'MID')  b.MID++;
    else if (item.riskLevel === 'HIGH') b.HIGH++;
  }

  return Array.from(map.values()).sort((a, b) => a.order - b.order);
}
