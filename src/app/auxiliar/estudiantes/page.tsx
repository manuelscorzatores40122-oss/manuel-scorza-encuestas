import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { FiltrosAuxiliar } from './FiltrosAuxiliar';
import styles from './estudiantes.module.css';

const PAGE_SIZE = 10;

export default async function AuxiliarEstudiantes({
  searchParams,
}: {
  searchParams: { q?: string; nivel?: string; gradoId?: string; seccionId?: string; page?: string };
}) {
  const q       = searchParams.q?.trim();
  const pageNum = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const nivelVal = searchParams.nivel === 'PRIMARIA' || searchParams.nivel === 'SECUNDARIA'
    ? searchParams.nivel : undefined;

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

  const [students, grades, sections, total, filteredTotal] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { section: { include: { grade: true } } },
      orderBy: [{ apellidoPaterno: 'asc' }, { apellidoMaterno: 'asc' }, { nombres: 'asc' }],
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.grade.findMany({ orderBy: [{ nivel: 'asc' }, { order: 'asc' }] }),
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
    return `/auxiliar/estudiantes?${params}`;
  }

  const from = filteredTotal === 0 ? 0 : (pageNum - 1) * PAGE_SIZE + 1;
  const to   = Math.min(pageNum * PAGE_SIZE, filteredTotal);

  return (
    <div className={styles.page}>

      <header className={styles.header}>
        <p className={styles.kick}>Panel · Auxiliar</p>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>Estudiantes</h1>
            <p className={styles.pageSub}>Información de matrícula y contacto familiar</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={styles.totalBadge}>{total}</div>
            <div className={styles.totalLabel}>matriculados</div>
          </div>
        </div>
      </header>

      <div className={styles.body}>

        <FiltrosAuxiliar
          grades={grades}
          sections={sections}
          defaultQ={q || ''}
          defaultNivel={searchParams.nivel || ''}
          defaultGradoId={searchParams.gradoId || ''}
          defaultSeccionId={searchParams.seccionId || ''}
        />

        {/* ── Tabla ── */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Estudiante</th>
                <th className={styles.th}>DNI / CE</th>
                <th className={styles.th}>Nivel · Grado · Sección</th>
                <th className={styles.th}>Sexo / Edad</th>
                <th className={`${styles.th} ${styles.thRight}`}></th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className={styles.tr}>
                  <td className={`${styles.td} ${styles.tdName}`}>
                    {s.apellidoPaterno} {s.apellidoMaterno}, {s.nombres}
                    {s.codigoEstudiante && <div className={styles.tdSub}>Cód. {s.codigoEstudiante}</div>}
                  </td>
                  <td className={`${styles.td} ${styles.tdDoc}`}>{s.dni}</td>
                  <td className={styles.td}>
                    {s.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'} · {s.section.grade.name}
                    <div className={styles.tdSub}>Sección {s.section.name}</div>
                  </td>
                  <td className={styles.td}>
                    {s.sexo === 'M' ? 'M' : 'F'}
                    <div className={styles.tdSub}>{s.edad} años</div>
                  </td>
                  <td className={`${styles.td} ${styles.thRight}`}>
                    <Link href={`/auxiliar/estudiantes/${s.id}`} className={styles.tdLink}>
                      Ver ficha
                    </Link>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td colSpan={5} className={styles.empty}>No hay estudiantes que coincidan con los filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Paginación ── */}
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            {filteredTotal === 0 ? 'Sin resultados' : `${from}–${to} de ${filteredTotal} estudiante${filteredTotal !== 1 ? 's' : ''}`}
          </span>
          <div className={styles.paginationControls}>
            {pageNum > 1 ? (
              <Link href={pageUrl(pageNum - 1)} className={styles.pageBtn}><ChevronLeft size={16} /> Anterior</Link>
            ) : (
              <span className={`${styles.pageBtn} ${styles.pageBtnDisabled}`}><ChevronLeft size={16} /> Anterior</span>
            )}
            <span className={styles.pageIndicator}>{pageNum} / {totalPages}</span>
            {pageNum < totalPages ? (
              <Link href={pageUrl(pageNum + 1)} className={styles.pageBtn}>Siguiente <ChevronRight size={16} /></Link>
            ) : (
              <span className={`${styles.pageBtn} ${styles.pageBtnDisabled}`}>Siguiente <ChevronRight size={16} /></span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
