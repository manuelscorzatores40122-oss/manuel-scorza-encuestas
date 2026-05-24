import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { TablaEstudiantes } from './TablaEstudiantes';
import { FiltrosEstudiantes } from './FiltrosEstudiantes';
import styles from './estudiantes.module.css';

const PAGE_SIZE = 10;

export default async function DirectorEstudiantes({
  searchParams,
}: {
  searchParams: { q?: string; nivel?: string; gradoId?: string; seccionId?: string; page?: string };
}) {
  const q        = searchParams.q?.trim();
  const pageNum  = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const nivelVal = searchParams.nivel === 'PRIMARIA' || searchParams.nivel === 'SECUNDARIA'
    ? searchParams.nivel : undefined;

  /* ── Where ── */
  const where: Prisma.StudentWhereInput = { estadoMatricula: 'DEFINITIVA' };

  if (q) {
    where.OR = [
      { dni:              { contains: q, mode: 'insensitive' } },
      { codigoEstudiante: { contains: q, mode: 'insensitive' } },
      { nombres:          { contains: q, mode: 'insensitive' } },
      { apellidoPaterno:  { contains: q, mode: 'insensitive' } },
      { apellidoMaterno:  { contains: q, mode: 'insensitive' } },
    ];
  }

  if (searchParams.seccionId) {
    where.sectionId = searchParams.seccionId;
  } else if (searchParams.gradoId) {
    where.section = { gradeId: searchParams.gradoId };
  } else if (nivelVal) {
    where.section = { grade: { nivel: nivelVal } };
  }

  /* ── Fetch ── */
  const [students, grades, sections, total, filteredTotal] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        section: { include: { grade: true } },
        apoderados: { orderBy: [{ esContactoPrincipal: 'desc' }, { parentesco: 'asc' }] },
      },
      orderBy: [{ apellidoPaterno: 'asc' }, { apellidoMaterno: 'asc' }, { nombres: 'asc' }],
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    // Todos los grados — el componente cliente filtra por nivel
    prisma.grade.findMany({ orderBy: [{ nivel: 'asc' }, { order: 'asc' }] }),
    // Todas las secciones — el componente cliente filtra por grado/nivel
    prisma.section.findMany({
      include: { grade: true },
      orderBy: [{ grade: { nivel: 'asc' } }, { grade: { order: 'asc' } }, { name: 'asc' }],
    }),
    prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA' } }),
    prisma.student.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (q)                       params.set('q',         q);
    if (searchParams.nivel)      params.set('nivel',     searchParams.nivel);
    if (searchParams.gradoId)    params.set('gradoId',   searchParams.gradoId);
    if (searchParams.seccionId)  params.set('seccionId', searchParams.seccionId);
    params.set('page', String(p));
    return `/director/estudiantes?${params}`;
  }

  const from = filteredTotal === 0 ? 0 : (pageNum - 1) * PAGE_SIZE + 1;
  const to   = Math.min(pageNum * PAGE_SIZE, filteredTotal);

  return (
    <div className={styles.page}>

      <header className={styles.header}>
        <p className={styles.kick}>Panel · Director</p>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>Estudiantes</h1>
            <p className={styles.pageSub}>Información completa de matrícula y contacto familiar</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={styles.totalBadge}>{total}</div>
            <div className={styles.totalLabel}>matriculados</div>
          </div>
        </div>
      </header>

      <div className={styles.body}>

        {/* ── Filtros (cliente, cascada instantánea) ── */}
        <FiltrosEstudiantes
          grades={grades}
          sections={sections}
          defaultQ={q || ''}
          defaultNivel={searchParams.nivel || ''}
          defaultGradoId={searchParams.gradoId || ''}
          defaultSeccionId={searchParams.seccionId || ''}
        />

        {/* ── Tabla ── */}
        <TablaEstudiantes students={students} />

        {/* ── Paginación ── */}
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            {filteredTotal === 0
              ? 'Sin resultados'
              : `${from}–${to} de ${filteredTotal} estudiante${filteredTotal !== 1 ? 's' : ''}`}
          </span>

          <div className={styles.paginationControls}>
            {pageNum > 1 ? (
              <Link href={pageUrl(pageNum - 1)} className={styles.pageBtn}>
                <ChevronLeft size={16} /> Anterior
              </Link>
            ) : (
              <span className={`${styles.pageBtn} ${styles.pageBtnDisabled}`}>
                <ChevronLeft size={16} /> Anterior
              </span>
            )}

            <span className={styles.pageIndicator}>{pageNum} / {totalPages}</span>

            {pageNum < totalPages ? (
              <Link href={pageUrl(pageNum + 1)} className={styles.pageBtn}>
                Siguiente <ChevronRight size={16} />
              </Link>
            ) : (
              <span className={`${styles.pageBtn} ${styles.pageBtnDisabled}`}>
                Siguiente <ChevronRight size={16} />
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
