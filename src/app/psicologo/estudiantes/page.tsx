import Link from 'next/link';
import { Users, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { StudentFilters } from './StudentFilters';
import styles from './page.module.css';

const PAGE_SIZE = 15;

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
  const page = Number(searchParams.page || '1');

  const where: any = { estadoMatricula: 'DEFINITIVA' };

  if (searchParams.q) {
    where.OR = [
      { nombres:        { contains: searchParams.q.toUpperCase() } },
      { apellidoPaterno:{ contains: searchParams.q.toUpperCase() } },
      { apellidoMaterno:{ contains: searchParams.q.toUpperCase() } },
    ];
  }

  /* filtro de ubicación: sección > grado > nivel (más específico gana) */
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
        section:    { include: { grade: true } },
        apoderados: { take: 3 },
        responses: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
          select: { riskLevel: true, riskScore: true, submittedAt: true },
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

  const riskLabel = (level?: string) =>
    level === 'HIGH' ? 'Alto' : level === 'MID' ? 'Medio' : level === 'LOW' ? 'Bajo' : null;

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Estudiantes</h1>
          <p className={styles.pageSubtitle}>
            {total} estudiante{total !== 1 ? 's' : ''} matriculados
          </p>
        </div>
      </header>

      {/* ── Filters ── */}
      <StudentFilters grades={grades} sections={sections} />

      {/* ══ MOBILE list (< 768 px) ══════════════════ */}
      <div className={styles.mobileList}>
        {students.length > 0 ? students.map((s) => {
          const lastResp = s.responses[0];
          const contact =
            s.apoderados.find((a) => a.esContactoPrincipal) ||
            s.apoderados.find((a) => a.parentesco === 'APODERADO') ||
            s.apoderados[0];
          return (
            <div key={s.id} className={styles.mobileRow}>
              <div className={styles.mobileInfo}>

                {/* Alumno */}
                <span className={styles.mobileName}>
                  {s.apellidoPaterno} {s.apellidoMaterno}, {s.nombres}
                </span>
                <span className={styles.mobileSub}>
                  {s.section.grade.name} {s.section.name}
                  {lastResp && (
                    <>
                      {' · '}
                      <span className={styles.riskBadge} data-risk={lastResp.riskLevel}>
                        {riskLabel(lastResp.riskLevel)}
                      </span>
                    </>
                  )}
                </span>

                {/* Apoderado */}
                {contact ? (
                  <span className={styles.mobileParent}>
                    <span className={styles.mobileParentName}>
                      {contact.apellidosNombres}
                    </span>
                    <span className={styles.mobileParentPhone}>
                      {contact.celular || 'Sin celular'}
                    </span>
                  </span>
                ) : (
                  <span className={styles.mobileParentEmpty}>Sin apoderado</span>
                )}

              </div>
              <Link
                href={`/psicologo/estudiantes/${s.id}`}
                className={styles.mobileVerBtn}
              >
                Ver <ArrowRight className={styles.viewIcon} />
              </Link>
            </div>
          );
        }) : (
          <div className={styles.empty}>
            <Users className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>Sin resultados</p>
            <p className={styles.emptyText}>No hay estudiantes con esos filtros.</p>
          </div>
        )}
      </div>

      {/* ══ DESKTOP table (≥ 768 px) ════════════════ */}
      <div className={styles.tableCard}>
        {students.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Estudiante</th>
                <th className={styles.th}>Grado / Secc.</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Edad</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Últ. riesgo</th>
                <th className={`${styles.th} ${styles.thCenter}`}>Encuestas</th>
                <th className={styles.th}>Contacto</th>
                <th className={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const lastResp = s.responses[0];
                const contact =
                  s.apoderados.find((a) => a.esContactoPrincipal) ||
                  s.apoderados.find((a) => a.parentesco === 'APODERADO') ||
                  s.apoderados[0];

                return (
                  <tr key={s.id} className={styles.row}>

                    <td className={styles.tdName}>
                      <span className={styles.studentName}>
                        {s.apellidoPaterno} {s.apellidoMaterno}, {s.nombres}
                      </span>
                      <span
                        className={styles.nivelBadge}
                        data-nivel={s.section.grade.nivel}
                      >
                        {s.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'}
                      </span>
                    </td>

                    <td className={styles.td}>
                      {s.section.grade.name} &mdash; {s.section.name}
                    </td>

                    <td className={`${styles.td} ${styles.tdCenter}`}>{s.edad}</td>

                    <td className={`${styles.td} ${styles.tdCenter}`}>
                      {lastResp ? (
                        <span className={styles.riskBadge} data-risk={lastResp.riskLevel}>
                          {riskLabel(lastResp.riskLevel)}
                        </span>
                      ) : (
                        <span className={styles.dash}>—</span>
                      )}
                    </td>

                    <td className={`${styles.td} ${styles.tdCenter}`}>
                      {s._count.responses}
                    </td>

                    <td className={styles.tdContact}>
                      {contact ? (
                        <>
                          <span className={styles.contactName}>
                            {contact.apellidosNombres}
                          </span>
                          <span className={styles.contactPhone}>
                            {contact.celular || 'Sin celular'}
                          </span>
                        </>
                      ) : (
                        <span className={styles.dash}>—</span>
                      )}
                    </td>

                    <td className={styles.tdAction}>
                      <Link
                        href={`/psicologo/estudiantes/${s.id}`}
                        className={styles.viewBtn}
                      >
                        Ver <ArrowRight className={styles.viewIcon} />
                      </Link>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className={styles.empty}>
            <Users className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>Sin resultados</p>
            <p className={styles.emptyText}>
              No hay estudiantes que coincidan con los filtros aplicados.
            </p>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
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
  );
}
