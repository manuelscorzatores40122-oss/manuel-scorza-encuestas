import Link from 'next/link';
import { Plus, ClipboardList } from 'lucide-react';

import { prisma } from '@/lib/prisma';
import { DatabaseUnavailable } from '@/components/BaseDatosNoDisponible';
import { GestorEncuestas } from './GestorEncuestas';
import styles from './page.module.css';

export default async function EncuestasPsicologo() {
  try {
    return await renderPage();
  } catch {
    return <DatabaseUnavailable />;
  }
}

async function renderPage() {
  const [raw, grades] = await Promise.all([
    prisma.survey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id:             true,
        title:          true,
        description:    true,
        isActive:       true,
        createdAt:      true,
        targetGrades:   true,
        targetSections: true,
        _count: { select: { responses: true, questions: true } },
      },
    }),
    prisma.grade.findMany({
      orderBy: [{ nivel: 'asc' }, { order: 'asc' }],
      include: { sections: { orderBy: { name: 'asc' } } },
    }),
  ]);

  const surveys = raw.map(s => ({ ...s, createdAt: s.createdAt.toISOString() }));

  return (
    <div className={styles.page}>

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
        {surveys.length === 0 ? (
          <EmptyState />
        ) : (
          <GestorEncuestas surveys={surveys} grades={grades} />
        )}
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
