import Link from 'next/link';
import { ArrowRight, Users, UserPlus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { FiltrosEstudiantes } from './FiltrosEstudiantes';
import { DatabaseUnavailable } from '@/components/BaseDatosNoDisponible';
import styles from './page.module.css';

const PAGE_SIZE = 20;

export default async function EstudiantesPsicologo({
  searchParams,
}: {
  searchParams: {
    q?: string;
    nivel?: string;
    gradoId?: string;
    sectionId?: string;
    riesgo?: string;
    page?: string;
  };
}) {
  try {
    return await renderPage(searchParams);
  } catch {
    return <DatabaseUnavailable />;
  }
}

async function renderPage(searchParams: {
  q?: string;
  nivel?: string;
  gradoId?: string;
  sectionId?: string;
  riesgo?: string;
  page?: string;
}) {
  const page = Number(searchParams.page || '1');

  const where: any = { estadoMatricula: 'DEFINITIVA' };

  if (searchParams.q) {
    where.OR = [
      { nombres:        { contains: searchParams.q.toUpperCase() } },
      { apellidoPaterno:{ contains: searchParams.q.toUpperCase() } },
      { apellidoMaterno:{ contains: searchParams.q.toUpperCase() } },
    ];
  }

  if (searchParams.sectionId) {
    where.sectionId = searchParams.sectionId;
  } else if (searchParams.gradoId) {
    where.section = { gradeId: searchParams.gradoId };
  } else if (searchParams.nivel) {
    where.section = { grade: { nivel: searchParams.nivel } };
  }

  if (searchParams.riesgo) {
    where.responses = { some: { riskLevel: searchParams.riesgo } };
  }

  const [students, grades, sections, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        section: { include: { grade: true } },
        responses: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
          select: { riskLevel: true },
        },
        _count: { select: { responses: true } },
      },
      orderBy: [{ apellidoPaterno: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.grade.findMany({ orderBy: [{ nivel: 'asc' }, { order: 'asc' }] }),
    prisma.section.findMany({
      select: { id: true, name: true, gradeId: true },
      orderBy: [{ grade: { order: 'asc' } }, { name: 'asc' }],
    }),
    prisma.student.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const from = (page - 1) * PAGE_SIZE + 1;
  const to   = Math.min(page * PAGE_SIZE, total);

  function buildHref(extra: Record<string, string>) {
    const p = new URLSearchParams();
    if (searchParams.q)         p.set('q',         searchParams.q);
    if (searchParams.nivel)     p.set('nivel',     searchParams.nivel);
    if (searchParams.gradoId)   p.set('gradoId',   searchParams.gradoId);
    if (searchParams.sectionId) p.set('sectionId', searchParams.sectionId);
    if (searchParams.riesgo)    p.set('riesgo',    searchParams.riesgo);
    Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    return `?${p.toString()}`;
  }

  return (
    <div className={styles.page}>

      {/* ── Encabezado ── */}
      <header className={styles.header}>
        <div>
          <div className={styles.kick}>Directorio</div>
          <h1 className={styles.pageTitle}>Estudiantes</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.total}>
            <b>{total}</b> matriculados · 2026
          </div>
          <Link href="/psicologo/estudiantes/nuevo" className={styles.addBtn}>
            <UserPlus size={14} strokeWidth={2} />
            Agregar
          </Link>
        </div>
      </header>

      <div className={styles.body}>

        {/* ── Filtros ── */}
        <FiltrosEstudiantes grades={grades} sections={sections} />

        {/* ── Tabla ── */}
        <div className={styles.table}>
          <div className={styles.thead}>
            <span>Estudiante</span>
            <span>Grado / sección</span>
            <span>Edad</span>
            <span>Últ. riesgo</span>
            <span className={styles.r}>Encuestas</span>
            <span className={styles.r}>Acción</span>
          </div>

          {students.length === 0 ? (
            <div className={styles.empty}>
              <Users className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>Sin resultados</p>
              <p className={styles.emptyText}>
                No hay estudiantes que coincidan con los filtros aplicados.
              </p>
            </div>
          ) : (
            <div>
              {students.map((s) => {
                const lastResp = s.responses[0];
                const nivel    = s.section.grade.nivel;
                const initials = avatarInitials(s.apellidoPaterno, s.nombres);
                return (
                  <Link
                    key={s.id}
                    href={`/psicologo/estudiantes/${s.id}`}
                    className={styles.row}
                  >
                    {/* Estudiante */}
                    <div className={styles.stu}>
                      <div className={styles.ava}>{initials}</div>
                      <div className={styles.stuInfo}>
                        <div className={styles.stuName}>
                          {s.apellidoPaterno} {s.apellidoMaterno}, {s.nombres}
                        </div>
                        <div className={`${styles.level} ${nivel === 'PRIMARIA' ? styles.levelPri : styles.levelSec}`}>
                          {nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'}
                        </div>
                      </div>
                    </div>

                    {/* Grado / sección */}
                    <div className={`${styles.cell} ${styles.cellGrade}`}>
                      {s.section.grade.name} — {s.section.name}
                    </div>

                    {/* Edad */}
                    <div className={`${styles.cell} ${styles.cellEdad}`}>
                      {s.edad}
                    </div>

                    {/* Riesgo */}
                    <div className={`${styles.cell} ${styles.cellRisk}`}>
                      {lastResp ? (
                        <RiskBadge level={lastResp.riskLevel} />
                      ) : (
                        <span className={styles.riskNone} />
                      )}
                    </div>

                    {/* Encuestas */}
                    <div className={`${styles.cell} ${styles.cellRight} ${styles.cellEnc}`}>
                      {s._count.responses}
                    </div>

                    {/* Acción */}
                    <div className={styles.viewCell}>
                      <span className={styles.viewLink}>
                        Ver ficha <ArrowRight className={styles.viewLinkIcon} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Paginación ── */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            {page > 1 ? (
              <Link href={buildHref({ page: String(page - 1) })} className={styles.pageBtn}>
                ← Anterior
              </Link>
            ) : <span />}
            <span className={styles.pageInfo}>{from}–{to} de {total}</span>
            {page < totalPages ? (
              <Link href={buildHref({ page: String(page + 1) })} className={styles.pageBtn}>
                Siguiente →
              </Link>
            ) : <span />}
          </div>
        )}

      </div>
    </div>
  );
}

/* ── Helpers ── */

function avatarInitials(apellido: string, nombres: string): string {
  return ((apellido[0] || '') + (nombres[0] || '')).toUpperCase();
}

function RiskBadge({ level }: { level: string }) {
  const cls = level === 'HIGH' ? styles.riskHigh : level === 'MID' ? styles.riskMid : styles.riskLow;
  const txt = level === 'HIGH' ? 'Alto' : level === 'MID' ? 'Medio' : 'Bajo';
  return <span className={`${styles.riskBadge} ${cls}`}>{txt}</span>;
}
