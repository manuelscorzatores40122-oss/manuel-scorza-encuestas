import Link from 'next/link';
import { Download, FileBarChart } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import { RiskBadge } from '@/components/EtiquetaRiesgo';
import { ImportarExcel } from './ImportarExcel';
import { FiltrosRespuestas } from './FiltrosRespuestas';
import styles from './page.module.css';

const PAGE_SIZE = 50;

export default async function RespuestasPsicologo({
  searchParams,
}: {
  searchParams: {
    q?: string;
    surveyId?: string;
    nivel?: string;
    gradoId?: string;
    sectionId?: string;
    riesgo?: string;
    page?: string;
  };
}) {
  const page = Number(searchParams.page || '1');

  /* ── Where principal ─────────────────────────────────────────────── */
  const where: any = {};

  if (searchParams.riesgo)   where.riskLevel = searchParams.riesgo;
  if (searchParams.surveyId) where.surveyId  = searchParams.surveyId;

  /* filtro de estudiante: sección > grado > nivel, + búsqueda por nombre */
  const q = searchParams.q?.trim().toUpperCase() ?? '';

  const studentFilter: any = {};

  if (q) {
    studentFilter.OR = [
      { nombres:         { contains: q } },
      { apellidoPaterno: { contains: q } },
      { apellidoMaterno: { contains: q } },
    ];
  }

  if (searchParams.sectionId) {
    studentFilter.sectionId = searchParams.sectionId;
  } else if (searchParams.gradoId) {
    studentFilter.section = { gradeId: searchParams.gradoId };
  } else if (searchParams.nivel) {
    studentFilter.section = { grade: { nivel: searchParams.nivel } };
  }

  if (Object.keys(studentFilter).length > 0) where.student = studentFilter;

  /* ── Consultas ──────────────────────────────────────────────────── */
  const [responses, total, surveys, grades, sections] = await Promise.all([
    prisma.response.findMany({
      where,
      include: {
        student: { include: { section: { include: { grade: true } } } },
        survey: true,
      },
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.response.count({ where }),
    prisma.survey.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.grade.findMany({ orderBy: [{ nivel: 'asc' }, { order: 'asc' }] }),
    prisma.section.findMany({
      select: { id: true, name: true, gradeId: true },
      orderBy: [{ grade: { order: 'asc' } }, { name: 'asc' }],
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const from = (page - 1) * PAGE_SIZE + 1;
  const to   = Math.min(page * PAGE_SIZE, total);

  function buildHref(extra: Record<string, string>) {
    const p = new URLSearchParams();
    if (searchParams.q)         p.set('q',         searchParams.q);
    if (searchParams.surveyId)  p.set('surveyId',  searchParams.surveyId);
    if (searchParams.nivel)     p.set('nivel',     searchParams.nivel);
    if (searchParams.gradoId)   p.set('gradoId',   searchParams.gradoId);
    if (searchParams.sectionId) p.set('sectionId', searchParams.sectionId);
    if (searchParams.riesgo)    p.set('riesgo',    searchParams.riesgo);
    Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    return `?${p.toString()}`;
  }

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <div className={styles.headerLeft}>
            <FileBarChart className={styles.headerIcon} />
            <h1 className={styles.pageTitle}>Respuestas</h1>
          </div>
          <p className={styles.pageSubtitle}>
            {total} respuesta{total !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {/* ── Filtros ── */}
      <FiltrosRespuestas surveys={surveys} grades={grades} sections={sections} />

      {/* ── Exportar ── */}
      <form action="/api/export/responses" method="GET" className={styles.exportCard}>
        <div className={styles.exportHeader}>
          <div>
            <p className={styles.exportTitle}>Exportar respuestas</p>
            <p className={styles.exportDesc}>
              Selecciona la encuesta, grado y sección antes de generar el archivo.
            </p>
          </div>
          <Download className={styles.exportIcon} />
        </div>

        <div className={styles.exportGrid}>
          <div className={styles.exportField}>
            <label className={styles.exportLabel}>Encuesta</label>
            <select name="surveyId" defaultValue={searchParams.surveyId || ''} className={styles.exportSelect}>
              <option value="">Todas</option>
              {surveys.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>

          <div className={styles.exportField}>
            <label className={styles.exportLabel}>Grado</label>
            <select name="gradoId" defaultValue={searchParams.gradoId || ''} className={styles.exportSelect}>
              <option value="">Todos</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'} {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.exportField}>
            <label className={styles.exportLabel}>Sección</label>
            <select name="sectionId" defaultValue={searchParams.sectionId || ''} className={styles.exportSelect}>
              <option value="">Todas</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.exportField}>
            <label className={styles.exportLabel}>Formato</label>
            <select name="format" defaultValue="xlsx" className={styles.exportSelect}>
              <option value="xlsx">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <button className={styles.exportBtn} type="submit">
            <Download className={styles.exportBtnIcon} />
            Exportar
          </button>
        </div>
      </form>

      {/* ── Importar ── */}
      <ImportarExcel surveys={surveys.map((s) => ({ id: s.id, title: s.title }))} />

      {/* ── Tabla ── */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Fecha</th>
              <th className={styles.th}>Estudiante</th>
              <th className={styles.th}>Grado / Secc.</th>
              <th className={styles.th}>Encuesta</th>
              <th className={`${styles.th} ${styles.thCenter}`}>Riesgo</th>
              <th className={`${styles.th} ${styles.thCenter}`}>Score</th>
              <th className={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {responses.map((r) => (
              <tr key={r.id} className={styles.row}>
                <td className={styles.td} style={{ whiteSpace: 'nowrap' }}>
                  {formatDateTime(r.submittedAt)}
                </td>
                <td className={styles.tdName}>
                  {r.student.apellidoPaterno} {r.student.apellidoMaterno},{' '}
                  {r.student.nombres}
                </td>
                <td className={styles.tdGrade}>
                  <span
                    className={styles.gradeBadge}
                    data-nivel={r.student.section.grade.nivel}
                  >
                    {r.student.section.grade.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'}
                  </span>
                  {r.student.section.grade.name} {r.student.section.name}
                </td>
                <td className={styles.td}>{r.survey.title}</td>
                <td className={`${styles.td} ${styles.tdCenter}`}>
                  <RiskBadge level={r.riskLevel} />
                </td>
                <td className={`${styles.td} ${styles.tdCenter}`} style={{ fontFamily: 'monospace' }}>
                  {r.riskScore}
                </td>
                <td className={styles.td}>
                  <Link href={`/psicologo/respuestas/${r.id}`} className={styles.viewLink}>
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
            {responses.length === 0 && (
              <tr className={styles.emptyRow}>
                <td colSpan={7}>Sin respuestas para los filtros aplicados.</td>
              </tr>
            )}
          </tbody>
        </table>
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
  );
}
