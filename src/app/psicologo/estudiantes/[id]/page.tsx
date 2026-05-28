import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, User, Mail, Star } from 'lucide-react';
import { BtnEliminarEstudiante } from './BtnEliminarEstudiante';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import { RiskBadge } from '@/components/EtiquetaRiesgo';
import { LineaTiempo } from './LineaTiempo';
import styles from './page.module.css';

export default async function HistorialEstudiante({
  params,
}: {
  params: { id: string };
}) {
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      section: { include: { grade: true } },
      apoderados: true,
      responses: {
        include: { survey: true, alerts: true },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });
  if (!student) notFound();

  const trend = student.responses
    .slice()
    .reverse()
    .map((r) => ({
      fecha: r.submittedAt.toISOString().slice(5, 10),
      score: r.riskScore,
    }));

  const parentescoLabel: Record<string, string> = {
    PADRE:     'Padre',
    MADRE:     'Madre',
    APODERADO: 'Apoderado',
    OTRO:      'Otro',
  };

  const nivel =
    student.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria';
  const sexo = student.sexo === 'F' ? 'Mujer' : 'Hombre';

  return (
    <div className={styles.page}>

      {/* Back + acciones */}
      <div className={styles.topBar}>
        <Link href="/psicologo/estudiantes" className={styles.backLink}>
          <ArrowLeft className={styles.backIcon} />
          Volver a estudiantes
        </Link>
        <BtnEliminarEstudiante
          studentId={student.id}
          nombre={`${student.apellidoPaterno} ${student.nombres}`}
        />
      </div>

      {/* Student info */}
      <div className={styles.card}>
        <h1 className={styles.studentName}>
          {student.apellidoPaterno} {student.apellidoMaterno},{' '}
          {student.nombres}
        </h1>
        <p className={styles.studentMeta}>
          {nivel} · {student.section.grade.name} {student.section.name}
        </p>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <p className={styles.infoLabel}>Edad</p>
            <p className={styles.infoValue}>{student.edad} años</p>
          </div>
          <div className={styles.infoItem}>
            <p className={styles.infoLabel}>Sexo</p>
            <p className={styles.infoValue}>{sexo}</p>
          </div>
          <div className={styles.infoItem}>
            <p className={styles.infoLabel}>Encuestas</p>
            <p className={styles.infoValue}>{student.responses.length}</p>
          </div>
          <div className={styles.infoItem}>
            <p className={styles.infoLabel}>Nivel</p>
            <p className={styles.infoValue}>{nivel}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {trend.length > 0 && <LineaTiempo data={trend} />}

      {/* Apoderados */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Phone className={styles.cardTitleIcon} />
          Apoderados y contactos
          {student.apoderados.length > 0 && (
            <span className={styles.cardCount}>{student.apoderados.length}</span>
          )}
        </h2>

        {student.apoderados.length > 0 ? (
          <div className={styles.apoderadoList}>
            {student.apoderados.map((a) => (
              <div key={a.id} className={styles.apoderadoCard}>

                {/* Cabecera del apoderado */}
                <div className={styles.apoderadoHeader}>
                  <div>
                    <p className={styles.apoderadoName}>{a.apellidosNombres}</p>
                    <p className={styles.apoderadoParentesco}>
                      {parentescoLabel[a.parentesco] ?? a.parentesco}
                    </p>
                  </div>
                  {a.esContactoPrincipal && (
                    <span className={styles.badgePrincipal}>
                      <Star className={styles.starIcon} />
                      Principal
                    </span>
                  )}
                </div>

                {/* Datos de contacto */}
                <div className={styles.apoderadoContacts}>
                  <div className={styles.apoderadoContactItem}>
                    <Phone className={styles.contactItemIcon} />
                    <span className={a.celular ? styles.contactItemValue : styles.contactItemEmpty}>
                      {a.celular || 'Sin celular'}
                    </span>
                  </div>
                  <div className={styles.apoderadoContactItem}>
                    <Mail className={styles.contactItemIcon} />
                    <span className={a.correo ? styles.contactItemValue : styles.contactItemEmpty}>
                      {a.correo || 'Sin correo'}
                    </span>
                  </div>
                  {a.numeroDocumento && (
                    <div className={styles.apoderadoContactItem}>
                      <span className={styles.docLabel}>
                        {a.tipoDocumento || 'DOC'}
                      </span>
                      <span className={styles.contactItemValue}>{a.numeroDocumento}</span>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noContact}>No hay apoderados registrados.</p>
        )}
      </div>

      {/* Historial de respuestas */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <User className={styles.cardTitleIcon} />
          Respuestas ({student.responses.length})
        </h2>
        <div className={styles.responseList}>
          {student.responses.map((r) => (
            <Link
              key={r.id}
              href={`/psicologo/respuestas/${r.id}`}
              className={styles.responseRow}
            >
              <div className={styles.responseInfo}>
                <p className={styles.responseSurvey}>{r.survey.title}</p>
                <p className={styles.responseMeta}>
                  {formatDateTime(r.submittedAt)} · Score {r.riskScore} ·{' '}
                  {r.alerts.length} alerta{r.alerts.length !== 1 ? 's' : ''}
                </p>
              </div>
              <RiskBadge level={r.riskLevel} />
            </Link>
          ))}
          {student.responses.length === 0 && (
            <p className={styles.emptyResponses}>
              El estudiante aún no ha respondido encuestas.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
