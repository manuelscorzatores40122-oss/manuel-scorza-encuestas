import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, Users, BarChart2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import { RiskBadge } from '@/components/EtiquetaRiesgo';
import { FiltrosEncuesta } from './FiltrosEncuesta';
import styles from './page.module.css';

export default async function EncuestaDetalle({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { q?: string; nivel?: string; gradoId?: string; sectionId?: string };
}) {
  const survey = await prisma.survey.findUnique({
    where: { id: params.id },
    include: { _count: { select: { responses: true, questions: true } } },
  });
  if (!survey) notFound();

  /* ── Filtros del usuario ─────────────────────────────────────────── */
  const q = searchParams.q?.trim().toUpperCase() ?? '';

  const locFilter: any = {};
  if (searchParams.sectionId) {
    locFilter.sectionId = searchParams.sectionId;
  } else if (searchParams.gradoId) {
    locFilter.section = { gradeId: searchParams.gradoId };
  } else if (searchParams.nivel) {
    locFilter.section = { grade: { nivel: searchParams.nivel } };
  }

  const nameOR = q
    ? [
        { nombres:         { contains: q } },
        { apellidoPaterno: { contains: q } },
        { apellidoMaterno: { contains: q } },
      ]
    : null;

  const studentFilter: any = { ...locFilter };
  if (nameOR) studentFilter.OR = nameOR;

  const hasFilter = !!(q || searchParams.sectionId || searchParams.gradoId || searchParams.nivel);

  /* ── Where para respuestas (table "Respondieron") ────────────────── */
  const responseWhere: any = { surveyId: params.id };
  if (hasFilter) responseWhere.student = studentFilter;

  /* ── Where para alumnos pendientes ──────────────────────────────── */
  const targetWhere: any = { estadoMatricula: 'DEFINITIVA', ...locFilter };
  if (nameOR) targetWhere.OR = nameOR;

  /* Sin filtro de usuario → aplicar scope de la encuesta */
  if (!hasFilter) {
    if (survey.targetSections.length > 0) {
      targetWhere.sectionId = { in: survey.targetSections };
    } else if (survey.targetGrades.length > 0) {
      targetWhere.section = { gradeId: { in: survey.targetGrades } };
    }
  }

  /* ── Consultas paralelas ─────────────────────────────────────────── */
  const [responses, targetStudents, grades, sections] = await Promise.all([
    prisma.response.findMany({
      where: responseWhere,
      include: {
        student: { include: { section: { include: { grade: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.student.findMany({
      where: targetWhere,
      include: { section: { include: { grade: true } } },
      orderBy: [{ apellidoPaterno: 'asc' }],
    }),
    prisma.grade.findMany({ orderBy: [{ nivel: 'asc' }, { order: 'asc' }] }),
    prisma.section.findMany({
      select: { id: true, name: true, gradeId: true },
      orderBy: [{ grade: { order: 'asc' } }, { name: 'asc' }],
    }),
  ]);

  const respondedIds = new Set(responses.map((r) => r.studentId));
  const pending      = targetStudents.filter((s) => !respondedIds.has(s.id));

  /* ── Stats (basados en datos filtrados) ──────────────────────────── */
  const answered  = responses.length;
  const total     = answered + pending.length;
  const rate      = total > 0 ? Math.round((answered / total) * 100) : 0;
  const highRisk  = responses.filter((r) => r.riskLevel === 'HIGH').length;

  return (
    <div className={styles.page}>

      {/* Back */}
      <Link href="/psicologo/encuestas" className={styles.backLink}>
        <ArrowLeft className={styles.backIcon} /> Volver a encuestas
      </Link>

      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>{survey.title}</h1>
          {survey.description && (
            <p className={styles.pageDesc}>{survey.description}</p>
          )}
        </div>
        <span className={survey.isActive ? styles.badgeActive : styles.badgeInactive}>
          {survey.isActive ? 'Activa' : 'Inactiva'}
        </span>
      </header>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <Users className={styles.statIcon} />
          <div>
            <p className={styles.statValue}>{answered}</p>
            <p className={styles.statLabel}>Respondieron</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <Clock className={styles.statIcon} />
          <div>
            <p className={styles.statValue}>{pending.length}</p>
            <p className={styles.statLabel}>Pendientes</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <BarChart2 className={styles.statIcon} />
          <div>
            <p className={styles.statValue}>{rate}%</p>
            <p className={styles.statLabel}>Tasa de respuesta</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <CheckCircle2 className={styles.statIcon} />
          <div>
            <p className={styles.statValue}>{highRisk}</p>
            <p className={styles.statLabel}>Alto riesgo</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <FiltrosEncuesta grades={grades} sections={sections} />

      {/* ── Respondieron ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <CheckCircle2 className={styles.sectionIcon} />
          Respondieron
          <span className={styles.sectionCount}>{answered}</span>
        </h2>

        <div className={styles.tableCard}>
          {responses.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Estudiante</th>
                  <th className={styles.th}>Grado / Secc.</th>
                  <th className={`${styles.th} ${styles.thCenter}`}>Riesgo</th>
                  <th className={`${styles.th} ${styles.thCenter}`}>Score</th>
                  <th className={styles.th}>Fecha</th>
                  <th className={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={r.id} className={styles.row}>
                    <td className={styles.tdName}>
                      {r.student.apellidoPaterno} {r.student.apellidoMaterno},{' '}
                      {r.student.nombres}
                    </td>
                    <td className={styles.td}>
                      {r.student.section.grade.name} — {r.student.section.name}
                    </td>
                    <td className={`${styles.td} ${styles.tdCenter}`}>
                      <RiskBadge level={r.riskLevel} />
                    </td>
                    <td className={`${styles.td} ${styles.tdCenter}`}>
                      {r.riskScore}
                    </td>
                    <td className={styles.td}>
                      {formatDateTime(r.submittedAt)}
                    </td>
                    <td className={styles.td}>
                      <Link href={`/psicologo/respuestas/${r.id}`} className={styles.viewLink}>
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.emptyMsg}>
              {hasFilter
                ? 'Ningún estudiante con esos filtros ha respondido.'
                : 'Ningún estudiante ha respondido aún.'}
            </p>
          )}
        </div>
      </section>

      {/* ── Pendientes ── */}
      {(pending.length > 0 || hasFilter) && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Clock className={styles.sectionIconMuted} />
            Pendientes
            <span className={styles.sectionCountMuted}>{pending.length}</span>
          </h2>

          <div className={styles.tableCard}>
            {pending.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Estudiante</th>
                    <th className={styles.th}>Grado / Secc.</th>
                    <th className={`${styles.th} ${styles.thCenter}`}>Edad</th>
                    <th className={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((s) => (
                    <tr key={s.id} className={styles.row}>
                      <td className={styles.tdName}>
                        {s.apellidoPaterno} {s.apellidoMaterno}, {s.nombres}
                      </td>
                      <td className={styles.td}>
                        {s.section.grade.name} — {s.section.name}
                      </td>
                      <td className={`${styles.td} ${styles.tdCenter}`}>{s.edad}</td>
                      <td className={styles.td}>
                        <Link
                          href={`/psicologo/estudiantes/${s.id}`}
                          className={styles.viewLink}
                        >
                          Ver alumno →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.emptyMsg}>
                Todos los estudiantes con esos filtros ya respondieron.
              </p>
            )}
          </div>
        </section>
      )}

    </div>
  );
}
