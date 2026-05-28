import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { FormularioNuevoEstudiante } from './FormularioNuevoEstudiante';
import styles from './nuevo.module.css';

export default async function NuevoEstudiantePsicologo() {
  const [grades, sections] = await Promise.all([
    prisma.grade.findMany({ orderBy: [{ nivel: 'asc' }, { order: 'asc' }] }),
    prisma.section.findMany({
      select: { id: true, name: true, gradeId: true },
      orderBy: [{ grade: { order: 'asc' } }, { name: 'asc' }],
    }),
  ]);

  return (
    <div className={styles.page}>

      <Link href="/psicologo/estudiantes" className={styles.back}>
        <ArrowLeft size={15} /> Volver a estudiantes
      </Link>

      <div className={styles.header}>
        <p className={styles.kick}>Panel · Psicólogo</p>
        <h1 className={styles.pageTitle}>Registrar estudiante</h1>
        <p className={styles.pageSub}>Agrega un estudiante manualmente indicando nivel, grado y sección</p>
      </div>

      <div className={styles.body}>
        <FormularioNuevoEstudiante grades={grades} sections={sections} />
      </div>

    </div>
  );
}
