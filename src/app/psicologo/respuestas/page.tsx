import Link from 'next/link';
import { Download, ArrowRight, BarChart3 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { DatabaseUnavailable } from '@/components/BaseDatosNoDisponible';
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
  try {
    return await renderPage(searchParams);
  } catch {
    return <DatabaseUnavailable />;
  }
}

async function renderPage(searchParams: {
  q?: string;
  surveyId?: string;
  nivel?: string;
  gradoId?: string;
  sectionId?: string;
  riesgo?: string;
  page?: string;
}) {
  const page = Number(searchParams.page || '1');

  const where: any = {};
  if (searchParams.riesgo)   where.riskLevel = searchParams.riesgo;
  if (searchParams.surveyId) where.surveyId  = searchParams.surveyId;

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

  const [responses, total, surveys, grades, sections] = await Promise.all([
    prisma.response.findMany({
      where,
      select: {
        id: true,
        submittedAt: true,
        riskLevel: true,
        riskScore: true,
        survey: { select: { title: true } },
        student: {
          select: {
            apellidoPaterno: true,
            apellidoMaterno: true,
            nombres: true,
            section: { include: { grade: { select: { name: true, nivel: true } } } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.response.count({ where }),
    prisma.survey.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, title: true } }),
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

      {/* ── Encabezado ── */}
      <header className={styles.header}>
        <div>
          <div className={styles.kick}>Resultados</div>
          <h1 className={styles.pageTitle}>Respuestas</h1>
        </div>
        <div className={styles.total}>
          <b>{total}</b> respuestas registradas
        </div>
      </header>

      <div className={styles.body}>

        {/* ── Filtros ── */}
        <FiltrosRespuestas surveys={surveys} grades={grades} sections={sections} />

        {/* ── Herramientas ── */}
        <div className={styles.tools}>

          {/* Exportar */}
          <form action="/api/export/responses" method="GET" className={styles.tool}>
            <div className={styles.toolHead}>
              <Download className={styles.toolHeadIcon} />
              <h3 className={styles.toolTitle}>Exportar respuestas</h3>
            </div>
            <p className={styles.toolDesc}>
              Selecciona la encuesta, grado y sección antes de generar el archivo.
            </p>

            <div className={styles.toolGrid}>
              <div className={styles.tf}>
                <label className={styles.tfLabel}>Encuesta</label>
                <select name="surveyId" defaultValue={searchParams.surveyId || ''} className={styles.fieldSel}>
                  <option value="">Todas</option>
                  {surveys.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div className={styles.tf}>
                <label className={styles.tfLabel}>Grado</label>
                <select name="gradoId" defaultValue={searchParams.gradoId || ''} className={styles.fieldSel}>
                  <option value="">Todos</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'} {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.tf}>
                <label className={styles.tfLabel}>Sección</label>
                <select name="sectionId" defaultValue={searchParams.sectionId || ''} className={styles.fieldSel}>
                  <option value="">Todas</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.tf}>
                <label className={styles.tfLabel}>Formato</label>
                <select name="format" defaultValue="xlsx" className={styles.fieldSel}>
                  <option value="xlsx">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>

            <button type="submit" className={styles.btnSolid}>
              <Download className={styles.btnSolidIcon} />
              Exportar archivo
            </button>
          </form>
        </div>

        {/* ── Tabla de resultados ── */}
        <div className={styles.secBar}>
          <h2 className={styles.secBarTitle}>Respuestas recibidas</h2>
          <span className={styles.secBarCount}>{total} resultado{total !== 1 ? 's' : ''}</span>
        </div>

        <div className={styles.tableWrap}>
          <div className={styles.thead}>
            <span>Fecha</span>
            <span>Estudiante</span>
            <span>Grado / sección</span>
            <span>Encuesta</span>
            <span>Riesgo</span>
            <span>Score</span>
            <span />
          </div>

          {responses.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIc}>
                <BarChart3 />
              </div>
              <h3 className={styles.emptyTitle}>Sin respuestas todavía</h3>
              <p className={styles.emptyText}>
                Aún no hay respuestas para los filtros aplicados. Aparecerán aquí cuando los estudiantes completen una encuesta.
              </p>
            </div>
          ) : (
            responses.map((r) => {
              const level = r.riskLevel as 'HIGH' | 'MID' | 'LOW';
              const riskCls = level === 'HIGH' ? styles.riskHigh : level === 'MID' ? styles.riskMid : styles.riskLow;
              const riskTxt = level === 'HIGH' ? 'Alto' : level === 'MID' ? 'Medio' : 'Bajo';
              return (
                <div key={r.id} className={styles.row}>
                  <div className={styles.cellDate}>{formatDate(r.submittedAt)}</div>
                  <div className={styles.cellName}>
                    {r.student.apellidoPaterno} {r.student.apellidoMaterno}, {r.student.nombres}
                  </div>
                  <div className={styles.cell}>
                    {r.student.section.grade.name} — {r.student.section.name}
                  </div>
                  <div className={styles.cell}>{r.survey.title}</div>
                  <div className={styles.cell}>
                    <span className={`${styles.riskBadge} ${riskCls}`}>{riskTxt}</span>
                  </div>
                  <div className={styles.cellScore}>{r.riskScore}</div>
                  <div>
                    <Link href={`/psicologo/respuestas/${r.id}`} className={styles.viewLink}>
                      Ver <ArrowRight className={styles.viewLinkIcon} />
                    </Link>
                  </div>
                </div>
              );
            })
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
