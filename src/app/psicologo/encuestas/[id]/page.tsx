import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart2, CheckCircle2, Clock, Users } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { FiltrosEncuesta } from './FiltrosEncuesta';
import { TablaResultados } from './TablaResultados';
import styles from './page.module.css';

export default async function EncuestaDetalle({
  params,
  searchParams,
}: {
  params:       { id: string };
  searchParams: { q?: string; nivel?: string; gradoId?: string; sectionId?: string };
}) {
  const survey = await prisma.survey.findUnique({
    where:   { id: params.id },
    include: { _count: { select: { responses: true, questions: true } } },
  });
  if (!survey) notFound();

  /* ── Filtros ─────────────────────────────────────────────────── */
  const q = searchParams.q?.trim().toUpperCase() ?? '';

  const locFilter: any = {};
  if      (searchParams.sectionId) locFilter.sectionId = searchParams.sectionId;
  else if (searchParams.gradoId)   locFilter.section = { gradeId: searchParams.gradoId };
  else if (searchParams.nivel)     locFilter.section = { grade:  { nivel: searchParams.nivel } };

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

  const responseWhere: any = { surveyId: params.id };
  if (hasFilter) responseWhere.student = studentFilter;

  const targetWhere: any = { estadoMatricula: 'DEFINITIVA', ...locFilter };
  if (nameOR) targetWhere.OR = nameOR;

  if (!hasFilter) {
    if      (survey.targetSections.length > 0) targetWhere.sectionId = { in: survey.targetSections };
    else if (survey.targetGrades.length   > 0) targetWhere.section   = { gradeId: { in: survey.targetGrades } };
  }

  /* ── Consultas paralelas ─────────────────────────────────────── */
  const [responses, targetStudents, grades, sections] = await Promise.all([
    prisma.response.findMany({
      where:   responseWhere,
      include: { student: { include: { section: { include: { grade: true } } } } },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.student.findMany({
      where:   targetWhere,
      include: { section: { include: { grade: true } } },
      orderBy: [{ apellidoPaterno: 'asc' }],
    }),
    prisma.grade.findMany({ orderBy: [{ nivel: 'asc' }, { order: 'asc' }] }),
    prisma.section.findMany({
      select:  { id: true, name: true, gradeId: true },
      orderBy: [{ grade: { order: 'asc' } }, { name: 'asc' }],
    }),
  ]);

  const respondedIds = new Set(responses.map(r => r.studentId));
  const pending      = targetStudents.filter(s => !respondedIds.has(s.id));

  const answered = responses.length;
  const total    = answered + pending.length;
  const rate     = total > 0 ? Math.round((answered / total) * 100) : 0;
  const highRisk = responses.filter(r => r.riskLevel === 'HIGH').length;

  /* ── Serializar fechas para Client Components ────────────────── */
  const responsesSer = responses.map(r => ({
    ...r,
    submittedAt: r.submittedAt.toISOString(),
  }));

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

      {/* Tablas paginadas */}
      <TablaResultados
        responses={responsesSer}
        pending={pending}
        hasFilter={hasFilter}
      />

    </div>
  );
}
