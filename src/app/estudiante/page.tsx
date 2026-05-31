import Link from 'next/link';
import Image from 'next/image';
import {
  ClipboardList, Heart, Megaphone, Phone, UserRound,
  ChevronRight, ChevronDown, GraduationCap, Layers, AlertCircle, PenLine,
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
  const gradeName = `${student.section.grade.name} ${student.section.name}`;

  return (
    <div className={styles.page}>

      {/* ══ HERO BANNER ══ */}
      <div className={styles.hero}>
        <div className={styles.heroBg} />

        <div className={styles.heroContent}>
          <p className={styles.heroGreeting}>¡Bienvenido/a de vuelta!</p>
          <h1 className={styles.heroName}>{firstName}</h1>
          <div className={styles.heroPills}>
            <span className={styles.heroPill}>
              <GraduationCap className={styles.heroPillIcon} />
              {nivel}
            </span>
            <span className={styles.heroPill}>
              <Layers className={styles.heroPillIcon} />
              {gradeName}
            </span>
          </div>
        </div>

        <div className={styles.heroShieldCard}>
          <Image
            src="/sss.png"
            alt="I.E. 40122 Manuel Scorza Torres"
            width={92}
            height={92}
            className={styles.heroShieldImg}
            priority
          />
          <span className={styles.heroShieldLabel}>I.E.</span>
          <span className={styles.heroShieldNum}>40122 Manuel Scorza</span>
        </div>
      </div>

      {/* ══ CUADRÍCULA DE ACCIONES (2 × 2) ══ */}
      <div className={styles.actionsGrid}>

        <Link href="/estudiante/encuestas" className={`${styles.actionCard} ${styles.cardOrange}`}>
          <div className={styles.cardIconBox}>
            <ClipboardList className={styles.cardIconSvg} />
          </div>
          <span className={styles.cardTitle}>Encuestas</span>
          {surveys.length > 0 ? (
            <span className={styles.cardBadge}>
              {surveys.length} pendiente{surveys.length > 1 ? 's' : ''}
            </span>
          ) : (
            <span className={styles.cardSub}>Sin pendientes</span>
          )}
        </Link>

        <Link href="/estudiante/anuncios" className={`${styles.actionCard} ${styles.cardBlue}`}>
          <div className={styles.cardIconBox}>
            <Megaphone className={styles.cardIconSvg} />
          </div>
          <span className={styles.cardTitle}>Anuncios</span>
          <span className={styles.cardSub}>Comunicados</span>
        </Link>

        <Link href="/estudiante/historial" className={`${styles.actionCard} ${styles.cardGreen}`}>
          <div className={styles.cardIconBox}>
            <Heart className={styles.cardIconSvg} />
          </div>
          <span className={styles.cardTitle}>Mi historial</span>
          <span className={styles.cardSub}>
            {myResponses > 0
              ? `${myResponses} respuesta${myResponses > 1 ? 's' : ''}`
              : 'Sin respuestas'}
          </span>
        </Link>

        <Link href="/estudiante/perfil" className={`${styles.actionCard} ${styles.cardPurple}`}>
          <div className={styles.cardIconBox}>
            <UserRound className={styles.cardIconSvg} />
          </div>
          <span className={styles.cardTitle}>Mi perfil</span>
          <span className={styles.cardSub}>Ver datos</span>
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
              <details key={s.id} className={styles.surveyAccordion}>
                <summary className={styles.surveyAccordionHead}>
                  <div className={styles.surveyCardNum}>{i + 1}</div>
                  <span className={styles.surveyCardTitle}>{s.title}</span>
                  <ChevronDown className={styles.surveyChevron} />
                </summary>
                <div className={styles.surveyAccordionBody}>
                  {s.description && (
                    <p className={styles.surveyCardDesc}>{s.description}</p>
                  )}
                  <Link href={`/estudiante/encuestas/${s.id}`} className={styles.surveyCtaBtn}>
                    Responder ahora
                    <ChevronRight className={styles.surveyCtaBtnIcon} />
                  </Link>
                </div>
              </details>
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
        <details className={styles.announcementsSection}>
          <summary className={styles.cardSummary}>
            <Megaphone className={styles.sectionIcon} />
            <span className={styles.cardSummaryTitle}>Anuncios</span>
            <Link href="/estudiante/anuncios" className={styles.seeAllLink}>
              Ver todos →
            </Link>
            <ChevronDown className={styles.cardChevron} />
          </summary>
          <div className={styles.announcementList}>
            {announcements.map((a) => (
              <details key={a.id} className={styles.announcementCard}>
                <summary className={styles.announcementSummary}>
                  <span className={styles.announcementTitle}>{a.title}</span>
                  <ChevronDown className={styles.announcementChevron} />
                </summary>
                <p className={styles.announcementBody}>{a.content}</p>
              </details>
            ))}
          </div>
        </details>
      )}

      {/* ══ FILA INFERIOR: CONTACTO + PERFIL ══ */}
      <div className={styles.contactRow}>

        {/* Contacto de emergencia */}
        <details className={styles.contactCard}>
          <summary className={styles.cardSummary}>
            <Phone className={styles.sectionIcon} />
            <span className={styles.cardSummaryTitle}>Contacto de emergencia</span>
            <ChevronDown className={styles.cardChevron} />
          </summary>

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
            <div className={styles.cardBody}>
              <div className={styles.emptyContact}>
                <AlertCircle className={styles.emptyContactIcon} />
                Aún no tienes contacto registrado
              </div>
              <Link href="/estudiante/perfil" className={styles.addLink}>
                <ChevronRight size={13} /> Agregar contacto de emergencia
              </Link>
            </div>
          )}
        </details>

        {/* Perfil resumen */}
        <details className={styles.profileSummaryCard}>
          <summary className={styles.cardSummary}>
            <UserRound className={styles.sectionIcon} />
            <span className={styles.cardSummaryTitle}>Mi perfil</span>
            <ChevronDown className={styles.cardChevron} />
          </summary>

          <div className={styles.cardBody}>
            <div className={styles.profileRows}>
              <div className={styles.profileRow}>
                <span className={styles.prLabel}>Nombre</span>
                <span className={styles.prValue}>{firstName}</span>
              </div>
              <div className={styles.profileRow}>
                <span className={styles.prLabel}>Nivel</span>
                <span className={styles.prValue}>{nivel} · {gradeName}</span>
              </div>
              <div className={styles.profileRow}>
                <span className={styles.prLabel}>Institución</span>
                <span className={styles.prValue}>I.E. 40122 Manuel Scorza</span>
              </div>
            </div>
            <Link href="/estudiante/perfil" className={styles.profileEditLink}>
              <PenLine size={12} /> Editar perfil
            </Link>
          </div>
        </details>

      </div>
    </div>
  );
}
