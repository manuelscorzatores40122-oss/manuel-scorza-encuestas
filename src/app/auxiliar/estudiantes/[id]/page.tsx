import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, BookOpen, Info } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import styles from './ficha.module.css';

export default async function AuxiliarFichaEstudiante({ params }: { params: { id: string } }) {
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      section: { include: { grade: true } },
      apoderados: { orderBy: [{ esContactoPrincipal: 'desc' }, { parentesco: 'asc' }] },
      responses: {
        include: { survey: true },
        orderBy: { submittedAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!student) notFound();

  const nivel = student.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria';

  const PARENTESCO: Record<string, string> = {
    PADRE: 'Padre', MADRE: 'Madre', APODERADO: 'Apoderado', OTRO: 'Otro',
  };

  return (
    <div className={styles.page}>

      <Link href="/auxiliar/estudiantes" className={styles.back}>
        <ArrowLeft size={15} /> Volver a estudiantes
      </Link>

      {/* ── Cabecera ── */}
      <div className={styles.heroCard}>
        <p className={styles.heroKick}>{nivel} · {student.section.grade.name} · Sección {student.section.name}</p>
        <h1 className={styles.heroName}>
          {student.apellidoPaterno} {student.apellidoMaterno}, {student.nombres}
        </h1>
        <div className={styles.heroMeta}>
          <span>{student.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>
          <span className={styles.heroDot} />
          <span>{student.edad} años</span>
          <span className={styles.heroDot} />
          <span>DNI {student.dni}</span>
          {student.codigoEstudiante && <>
            <span className={styles.heroDot} />
            <span>Cód. {student.codigoEstudiante}</span>
          </>}
        </div>
      </div>

      <div className={styles.grid}>

        {/* ── Apoderados ── */}
        <section className={styles.section}>
          <h2 className={styles.sectTitle}>
            <Phone size={15} /> Contacto familiar
          </h2>
          {student.apoderados.length === 0 ? (
            <p className={styles.empty}>Sin apoderado registrado.</p>
          ) : (
            <div className={styles.apoderadoList}>
              {student.apoderados.map(a => (
                <div key={a.id} className={styles.apoderado}>
                  <div className={styles.apoderadoTop}>
                    <span className={styles.apoderadoName}>{a.apellidosNombres}</span>
                    {a.esContactoPrincipal && <span className={styles.badge}>Principal</span>}
                  </div>
                  <div className={styles.apoderadoRole}>{PARENTESCO[a.parentesco] ?? a.parentesco}</div>
                  <div className={styles.apoderadoContact}>
                    {a.celular && <span className={styles.contactItem}><Phone size={12} />{a.celular}</span>}
                    {a.correo  && <span className={styles.contactItem}><Mail  size={12} />{a.correo}</span>}
                    {!a.celular && !a.correo && <span className={styles.contactNone}>Sin contacto</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Encuestas respondidas ── */}
        <section className={styles.section}>
          <h2 className={styles.sectTitle}>
            <BookOpen size={15} /> Encuestas respondidas
            <span className={styles.sectCount}>{student.responses.length}</span>
          </h2>

          <div className={styles.notice}>
            <Info size={13} style={{ flexShrink: 0 }} />
            Los niveles de riesgo son visibles solo para el psicólogo.
          </div>

          {student.responses.length === 0 ? (
            <p className={styles.empty}>El estudiante aún no ha respondido encuestas.</p>
          ) : (
            <div className={styles.responseList}>
              {student.responses.map(r => (
                <div key={r.id} className={styles.responseItem}>
                  <div className={styles.responseName}>{r.survey.title}</div>
                  <div className={styles.responseDate} suppressHydrationWarning>
                    {formatDateTime(r.submittedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
