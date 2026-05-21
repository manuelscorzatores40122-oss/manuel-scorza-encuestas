import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Megaphone, Users, CalendarDays } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import styles from './page.module.css';

export default async function AnuncioDetalle({ params }: { params: { id: string } }) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: params.id },
    include: { createdBy: { select: { fullName: true } } },
  });
  if (!announcement) notFound();

  /* destinatarios: estudiantes activos si STUDENT está en targetRoles */
  const targetStudents = announcement.targetRoles.includes('STUDENT')
    ? await prisma.student.findMany({
        where: { estadoMatricula: 'DEFINITIVA' },
        include: { section: { include: { grade: true } } },
        orderBy: [{ apellidoPaterno: 'asc' }],
      })
    : [];

  return (
    <div className={styles.page}>

      {/* Back */}
      <Link href="/psicologo/anuncios" className={styles.backLink}>
        <ArrowLeft className={styles.backIcon} /> Volver a anuncios
      </Link>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <Megaphone className={styles.megaIcon} />
        </div>
        <div className={styles.headerMeta}>
          <h1 className={styles.pageTitle}>{announcement.title}</h1>
          <p className={styles.pageMeta}>
            <CalendarDays className={styles.metaIcon} />
            {formatDateTime(announcement.createdAt)}
            {' · '}por {announcement.createdBy.fullName}
          </p>
        </div>
        <span className={announcement.isPublished ? styles.badgePublished : styles.badgeDraft}>
          {announcement.isPublished ? 'Publicado' : 'Borrador'}
        </span>
      </header>

      {/* Contenido */}
      <div className={styles.contentCard}>
        <p className={styles.content}>{announcement.content}</p>
      </div>

      {/* Destinatarios */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Users className={styles.sectionIcon} />
          Destinatarios
          <span className={styles.sectionCount}>{targetStudents.length}</span>
        </h2>

        {targetStudents.length > 0 ? (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Estudiante</th>
                  <th className={styles.th}>Nivel</th>
                  <th className={styles.th}>Grado / Secc.</th>
                  <th className={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {targetStudents.map((s) => (
                  <tr key={s.id} className={styles.row}>
                    <td className={styles.tdName}>
                      {s.apellidoPaterno} {s.apellidoMaterno}, {s.nombres}
                    </td>
                    <td className={styles.td}>
                      <span
                        className={styles.nivelBadge}
                        data-nivel={s.section.grade.nivel}
                      >
                        {s.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {s.section.grade.name} — {s.section.name}
                    </td>
                    <td className={styles.td}>
                      <Link
                        href={`/psicologo/estudiantes/${s.id}`}
                        className={styles.viewLink}
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyCard}>
            <p className={styles.emptyMsg}>
              {announcement.targetRoles.length === 0
                ? 'Este anuncio no tiene roles destino asignados.'
                : 'Este anuncio no está dirigido a estudiantes.'}
            </p>
          </div>
        )}
      </section>

    </div>
  );
}
