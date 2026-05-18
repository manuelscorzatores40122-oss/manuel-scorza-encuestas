import Link from 'next/link';

import {
  ClipboardList,
  Heart,
  Megaphone,
  Phone,
  UserRound,
} from 'lucide-react';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { listPublishedAnnouncementsFor } from '@/lib/announcements';

import styles from './page.module.css';

export default async function EstudianteHome() {

  const session = (await getSession())!;

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    include: {
      section: { include: { grade: true } },
      apoderados: true,
    },
  });

  if (!student) {
    return <p>No se encontró tu ficha de estudiante.</p>;
  }

  const [surveys, myResponses, announcements] = await Promise.all([
    prisma.survey.findMany({
      where: {
        isActive: true,
        responses: { none: { studentId: student.id } },
        OR: [
          { targetGrades: { has: student.section.gradeId } },
          { targetGrades: { isEmpty: true } },
        ],
        AND: [
          {
            OR: [
              { targetSections: { has: student.sectionId } },
              { targetSections: { isEmpty: true } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, description: true },
    }),
    prisma.response.count({ where: { studentId: student.id } }),
    listPublishedAnnouncementsFor('STUDENT', 3),
  ]);

  const emergencyContact =
    student.apoderados.find((a) => a.esContactoPrincipal) ||
    student.apoderados.find((a) => a.parentesco === 'APODERADO') ||
    student.apoderados[0];

  // Iniciales para el avatar del contacto
  const initials = emergencyContact?.apellidosNombres
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('') ?? '?';

  return (
    <div className={styles.container}>

      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          ¡Hola, {student.nombres.split(' ')[0]}!
        </h1>

        <p className={styles.subtitle}>
          {student.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'}
          {' · '}
          {student.section.grade.name} {student.section.name}
        </p>
      </header>

      {/* Stats */}
      <div className={styles.statsGrid}>

        <Link
          href="/estudiante/encuestas"
          className={`${styles.cardButton} ${styles.warmCard}`}
        >
          <div className={styles.cardRow}>
            <div className={`${styles.iconBox} ${styles.warmIcon}`}>
              <ClipboardList className="w-5 h-5" />
            </div>

            <div className={styles.cardContent}>
              <p className={styles.statNumber}>{surveys.length}</p>
              <p className={styles.statLabel}>Encuestas por responder</p>
            </div>

            <span className={styles.arrow}>→</span>
          </div>
        </Link>

        <Link
          href="/estudiante/historial"
          className={`${styles.cardButton} ${styles.brandCard}`}
        >
          <div className={styles.cardRow}>
            <div className={`${styles.iconBox} ${styles.brandIcon}`}>
              <Heart className="w-5 h-5" />
            </div>

            <div className={styles.cardContent}>
              <p className={styles.statNumber}>{myResponses}</p>
              <p className={styles.statLabel}>Respuestas enviadas</p>
            </div>

            <span className={styles.arrow}>→</span>
          </div>
        </Link>

      </div>

      {/* Anuncios */}
      {announcements.length > 0 && (
        <section className={`${styles.card} ${styles.announcementsCard}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Megaphone className="w-5 h-5" />
              Anuncios
            </h2>
            <Link href="/estudiante/anuncios" className={styles.link}>
              Ver todos →
            </Link>
          </div>

          <div className={styles.announcementList}>
            {announcements.map((a) => (
              <article key={a.id} className={styles.announcement}>
                <p className={styles.announcementTitle}>{a.title}</p>
                <p className={styles.announcementContent}>{a.content}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Bottom: Contacto + Perfil */}
      <section className={styles.bottomGrid}>

        <div className={`${styles.card} ${styles.contactCard}`}>
          <h2 className={styles.sectionTitle}>
            <Phone className="w-5 h-5" />
            Contacto de emergencia
          </h2>

          {emergencyContact ? (
            <div className={styles.contactInfo}>
              <div className={styles.contactAvatar}>{initials}</div>

              <p className={styles.contactName}>
                {emergencyContact.apellidosNombres}
              </p>

              <span className={styles.contactBadge}>
                {emergencyContact.parentesco}
              </span>

              <p className={styles.contactText}>
                Celular: {emergencyContact.celular || 'No registrado'}
              </p>

              {emergencyContact.correo && (
                <p className={styles.contactText}>
                  Correo: {emergencyContact.correo}
                </p>
              )}
            </div>
          ) : (
            <p className={styles.emptyText}>
              Aún no tienes contacto de emergencia registrado.
            </p>
          )}
        </div>

        <Link href="/estudiante/perfil" className={styles.profileCard}>
          <div className={styles.profileIconWrap}>
            <UserRound className={styles.profileIcon} />
          </div>

          <p className={styles.profileTitle}>Actualizar perfil</p>

          <p className={styles.profileText}>
            Edita datos de padre, madre, apoderado y número de emergencia.
          </p>
        </Link>

      </section>
    </div>
  );
}
