import Link from 'next/link';
import { Plus, Eye, ClipboardList } from 'lucide-react';

import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { DatabaseUnavailable } from '@/components/BaseDatosNoDisponible';
import { AccionesEncuesta } from './AccionesEncuesta';
import styles from './page.module.css';

export default async function EncuestasPsicologo() {
  try {
    return await renderPage();
  } catch {
    return <DatabaseUnavailable />;
  }
}

async function renderPage() {
  const surveys = await prisma.survey.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      isActive: true,
      createdAt: true,
      _count: { select: { responses: true, questions: true } },
    },
  });

  return (
    <div className={styles.page}>

      {/* ── Encabezado ── */}
      <header className={styles.header}>
        <div>
          <div className={styles.kick}>Gestión</div>
          <h1 className={styles.pageTitle}>Encuestas</h1>
        </div>
        <Link href="/psicologo/encuestas/nueva" className={styles.btnSolid}>
          <Plus className={styles.btnIcon} />
          Nueva encuesta
        </Link>
      </header>

      <div className={styles.body}>
        <div className={styles.table}>

          {/* Cabecera de columnas */}
          <div className={styles.thead}>
            <span>Encuesta</span>
            <span className={styles.c}>Preguntas</span>
            <span className={styles.c}>Respuestas</span>
            <span>Estado</span>
            <span>Creada</span>
            <span className={styles.r}>Acciones</span>
          </div>

          {surveys.length === 0 ? (
            <EmptyState />
          ) : (
            <div>
              {surveys.map((s) => (
                <div
                  key={s.id}
                  className={`${styles.row} ${!s.isActive ? styles.rowOff : ''}`}
                >
                  {/* Encuesta */}
                  <div>
                    <div className={styles.eTitle}>{s.title}</div>
                    {s.description && (
                      <div className={styles.eSub}>{s.description}</div>
                    )}
                  </div>

                  {/* Preguntas */}
                  <div className={`${styles.num} ${s._count.questions === 0 ? styles.numZero : ''}`}>
                    {s._count.questions}
                  </div>

                  {/* Respuestas */}
                  <div className={`${styles.num} ${s._count.responses === 0 ? styles.numZero : ''}`}>
                    {s._count.responses}
                  </div>

                  {/* Estado */}
                  <div>
                    <span className={`${styles.state} ${s.isActive ? styles.stateOn : styles.stateOff}`}>
                      <span className={styles.stateDot} />
                      {s.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  {/* Creada */}
                  <div className={styles.date}>{formatDate(s.createdAt)}</div>

                  {/* Resumen para móvil */}
                  <div className={styles.metaMob}>
                    {s._count.questions} preguntas · {s._count.responses} respuestas · {formatDate(s.createdAt)}
                  </div>

                  {/* Acciones */}
                  <div className={styles.acts}>
                    <Link
                      href={`/psicologo/encuestas/${s.id}`}
                      className={`${styles.act} ${styles.actGreen}`}
                    >
                      <Eye className={styles.actIcon} />
                      Ver
                    </Link>
                    <AccionesEncuesta
                      id={s.id}
                      title={s.title}
                      isActive={s.isActive}
                      responsesCount={s._count.responses}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIc}>
        <ClipboardList className={styles.emptyIcSvg} />
      </div>
      <h3 className={styles.emptyTitle}>Aún no hay encuestas</h3>
      <p className={styles.emptyText}>
        Crea tu primera encuesta para empezar a recoger respuestas de los estudiantes.
      </p>
      <Link href="/psicologo/encuestas/nueva" className={styles.btnSolid}>
        <Plus className={styles.btnIcon} />
        Nueva encuesta
      </Link>
    </div>
  );
}
