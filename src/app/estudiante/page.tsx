import Link from 'next/link';
import { ClipboardList, Heart, Megaphone, Phone, UserRound, ChevronRight } from 'lucide-react';
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

  const gradeId   = student.section?.gradeId ?? '';
  const sectionId = student.sectionId        ?? '';

  const [allActiveSurveys, myResponses, announcements] = await Promise.all([
    prisma.survey.findMany({
      where:   { isActive: true, responses: { none: { studentId: student.id } } },
      orderBy: { createdAt: 'desc' },
      select:  { id: true, title: true, description: true, targetGrades: true, targetSections: true },
    }),
    prisma.response.count({ where: { studentId: student.id } }),
    listPublishedAnnouncementsFor('STUDENT', 3),
  ]);

  const surveys = allActiveSurveys.filter(s => {
    const tg = s.targetGrades   ?? [];
    const ts = s.targetSections ?? [];
    return (tg.length === 0 || tg.includes(gradeId))
        && (ts.length === 0 || ts.includes(sectionId));
  });

  const emergencyContact =
    student.apoderados.find((a) => a.esContactoPrincipal) ||
    student.apoderados.find((a) => a.parentesco === 'APODERADO') ||
    student.apoderados[0];

  const initials = emergencyContact?.apellidosNombres
    ?.split(' ').slice(0, 2).map((w) => w[0]).join('') ?? '?';

  const firstName = student.nombres.split(' ')[0];
  const nivel = student.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria';

  return (
    <div className={styles.page}>

      {/* ══ HERO BANNER ══ */}
      <div className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <p className={styles.heroGreeting}>¡Bienvenido/a de vuelta!</p>
          <h1 className={styles.heroName}>{firstName}</h1>
          <span className={styles.heroBadge}>
            {nivel} · {student.section.grade.name} {student.section.name}
          </span>
        </div>
        <div className={styles.heroIllustration}>🎓</div>
      </div>

      {/* ══ BOTONES DE ACCIÓN ══ */}
      <div className={styles.actionsCol}>

        <Link href="/estudiante/encuestas" className={`${styles.actionBtn} ${styles.actionOrange}`}>
          <div className={styles.actionLeft}>
            <div className={styles.actionIconWrap}>
              <ClipboardList className={styles.actionIcon} />
            </div>
            <div className={styles.actionText}>
              <span className={styles.actionTitle}>Ver encuestas activas</span>
              <span className={styles.actionSub}>
                {surveys.length > 0
                  ? `${surveys.length} pendiente${surveys.length > 1 ? 's' : ''}`
                  : 'Sin pendientes'}
              </span>
            </div>
          </div>
          {surveys.length > 0 && (
            <span className={styles.actionBadge}>{surveys.length}</span>
          )}
          <ChevronRight className={styles.actionArrow} />
        </Link>

        <Link href="/estudiante/anuncios" className={`${styles.actionBtn} ${styles.actionBlue}`}>
          <div className={styles.actionLeft}>
            <div className={styles.actionIconWrap}>
              <Megaphone className={styles.actionIcon} />
            </div>
            <div className={styles.actionText}>
              <span className={styles.actionTitle}>Ver anuncios</span>
              <span className={styles.actionSub}>Comunicados de la institución</span>
            </div>
          </div>
          <ChevronRight className={styles.actionArrow} />
        </Link>

        <Link href="/estudiante/historial" className={`${styles.actionBtn} ${styles.actionGreen}`}>
          <div className={styles.actionLeft}>
            <div className={styles.actionIconWrap}>
              <Heart className={styles.actionIcon} />
            </div>
            <div className={styles.actionText}>
              <span className={styles.actionTitle}>Mi historial</span>
              <span className={styles.actionSub}>
                {myResponses > 0
                  ? `${myResponses} respuesta${myResponses > 1 ? 's' : ''} enviada${myResponses > 1 ? 's' : ''}`
                  : 'Sin respuestas aún'}
              </span>
            </div>
          </div>
          <ChevronRight className={styles.actionArrow} />
        </Link>

      </div>

      {/* ══ ENCUESTAS PENDIENTES ══ */}
      {surveys.length > 0 && (
        <section className={styles.surveysSection}>
          <div className={styles.surveysSectionHeader}>
            <div className={styles.surveysSectionLeft}>
              <div className={styles.surveysSectionIcon}>
                <ClipboardList className={styles.surveysSectionIconSvg} />
              </div>
              <div>
                <h2 className={styles.surveysSectionTitle}>Encuestas pendientes</h2>
                <p className={styles.surveysSectionSub}>{surveys.length} por responder</p>
              </div>
            </div>
            <Link href="/estudiante/encuestas" className={styles.surveysVerTodas}>
              Ver todas
            </Link>
          </div>

          <div className={styles.surveyList}>
            {surveys.slice(0, 3).map((s, i) => (
              <Link key={s.id} href={`/estudiante/encuestas/${s.id}`} className={styles.surveyCard}>
                <div className={styles.surveyCardNum}>{i + 1}</div>
                <div className={styles.surveyCardBody}>
                  <p className={styles.surveyCardTitle}>{s.title}</p>
                  {s.description && (
                    <p className={styles.surveyCardDesc}>{s.description}</p>
                  )}
                  <span className={styles.surveyCardCta}>Responder ahora →</span>
                </div>
                <ChevronRight className={styles.surveyCardArrow} />
              </Link>
            ))}
          </div>

          {surveys.length > 3 && (
            <Link href="/estudiante/encuestas" className={styles.surveysMore}>
              + {surveys.length - 3} encuesta{surveys.length - 3 > 1 ? 's' : ''} más
            </Link>
          )}
        </section>
      )}

      {/* ══ ANUNCIOS ══ */}
      {announcements.length > 0 && (
        <section className={styles.announcementsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Megaphone className={styles.sectionIcon} />
              Anuncios
            </h2>
            <Link href="/estudiante/anuncios" className={styles.seeAllLink}>Ver todos →</Link>
          </div>
          <div className={styles.announcementList}>
            {announcements.map((a) => (
              <article key={a.id} className={styles.announcementCard}>
                <p className={styles.announcementTitle}>{a.title}</p>
                <p className={styles.announcementBody}>{a.content}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ══ CONTACTO + PERFIL ══ */}
      <div className={styles.bottomGrid}>

        {/* Contacto de emergencia */}
        <div className={styles.contactCard}>
          <h2 className={styles.sectionTitle}>
            <Phone className={styles.sectionIcon} />
            Contacto de emergencia
          </h2>

          {emergencyContact ? (
            <div className={styles.contactBody}>
              <div className={styles.contactAvatar}>{initials}</div>
              <div className={styles.contactDetails}>
                <p className={styles.contactName}>{emergencyContact.apellidosNombres}</p>
                <span className={styles.contactBadge}>{emergencyContact.parentesco}</span>
                {emergencyContact.celular && (
                  <p className={styles.contactLine}>📞 {emergencyContact.celular}</p>
                )}
                {emergencyContact.correo && (
                  <p className={styles.contactLine}>✉️ {emergencyContact.correo}</p>
                )}
              </div>
            </div>
          ) : (
            <p className={styles.emptyContact}>
              Aún no tienes contacto registrado.
            </p>
          )}
        </div>

        {/* Ir al perfil */}
        <Link href="/estudiante/perfil" className={styles.profileCard}>
          <div className={styles.profileIconBox}>
            <UserRound className={styles.profileIcon} />
          </div>
          <p className={styles.profileTitle}>Mi perfil</p>
          <p className={styles.profileDesc}>
            Actualiza datos de tu apoderado y número de emergencia.
          </p>
          <span className={styles.profileCta}>Editar datos →</span>
        </Link>

      </div>
    </div>
  );
}
