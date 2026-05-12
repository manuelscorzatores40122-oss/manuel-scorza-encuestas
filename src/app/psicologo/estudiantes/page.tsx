import Link from 'next/link';
import { Users, Search } from 'lucide-react';
import { prisma } from '@/lib/prisma';

import styles from './page.module.css';

const PAGE_SIZE = 10;

export default async function EstudiantesPsicologo({
  searchParams,
}: {
  searchParams: {
    q?: string;
    gradoId?: string;
    page?: string;
  };
}) {
  const page = Number(searchParams.page || '1');

  const where: any = {
    estadoMatricula: 'DEFINITIVA',
  };

  if (searchParams.q) {
    where.OR = [
      { nombres: { contains: searchParams.q.toUpperCase() } },
      { apellidoPaterno: { contains: searchParams.q.toUpperCase() } },
      { apellidoMaterno: { contains: searchParams.q.toUpperCase() } },
    ];
  }

  if (searchParams.gradoId) {
    where.section = {
      gradeId: searchParams.gradoId,
    };
  }

  const [students, grades, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        section: {
          include: {
            grade: true,
          },
        },
        apoderados: true,
        _count: {
          select: {
            responses: true,
          },
        },
      },
      orderBy: [
        {
          apellidoPaterno: 'asc',
        },
      ],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),

    prisma.grade.findMany({
      orderBy: [
        { nivel: 'asc' },
        { order: 'asc' },
      ],
    }),

    prisma.student.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <Users className={styles.titleIcon} />
        Estudiantes
      </h1>

      <form className={styles.filters}>
        <div className={styles.searchGroup}>
          <label className={styles.label}>
            Buscar estudiante
          </label>

          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} />

            <input
              name="q"
              defaultValue={searchParams.q || ''}
              className={styles.input}
              placeholder="Ej. García..."
            />
          </div>
        </div>

        <div className={styles.selectGroup}>
          <label className={styles.label}>
            Grado
          </label>

          <select
            name="gradoId"
            defaultValue={searchParams.gradoId || ''}
            className={styles.input}
          >
            <option value="">Todos</option>

            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'} {g.name}
              </option>
            ))}
          </select>
        </div>

        <button className={styles.button}>
          Filtrar
        </button>
      </form>

      <div className={styles.studentsGrid}>
        {students.map((s) => {
          const emergency =
            s.apoderados.find((a) => a.esContactoPrincipal) ||
            s.apoderados.find((a) => a.parentesco === 'APODERADO') ||
            s.apoderados[0];

          return (
            <div key={s.id} className={styles.studentCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.studentName}>
                  {s.apellidoPaterno} {s.apellidoMaterno},{' '}
                  {s.nombres}
                </h3>

                <span className={styles.badge}>
                  {s.section.grade.nivel === 'PRIMARIA'
                    ? 'Primaria'
                    : 'Secundaria'}
                </span>
              </div>

              <div className={styles.cardInfo}>
                <p>
                  <strong>Grado:</strong>{' '}
                  {s.section.grade.name} {s.section.name}
                </p>

                <p>
                  <strong>Edad:</strong> {s.edad}
                </p>

                <p>
                  <strong>Respuestas:</strong>{' '}
                  {s._count.responses}
                </p>
              </div>

              <div className={styles.contactBox}>
                {emergency ? (
                  <>
                    <p className={styles.emergencyName}>
                      {emergency.apellidosNombres}
                    </p>

                    <p className={styles.muted}>
                      {emergency.celular || 'Sin celular'}
                    </p>
                  </>
                ) : (
                  <span className={styles.noContact}>
                    Sin contacto
                  </span>
                )}
              </div>

              <Link
                href={`/psicologo/estudiantes/${s.id}`}
                className={styles.historyLink}
              >
                Ver histórico
              </Link>
            </div>
          );
        })}
      </div>

      {students.length === 0 && (
        <div className={styles.empty}>
          No se encontraron estudiantes.
        </div>
      )}

      <div className={styles.pagination}>
        {page > 1 && (
          <Link
            href={`?q=${searchParams.q || ''}&gradoId=${searchParams.gradoId || ''}&page=${page - 1}`}
            className={styles.pageButton}
          >
            ← Anterior
          </Link>
        )}

        <span className={styles.pageInfo}>
          Página {page} de {totalPages || 1}
        </span>

        {page < totalPages && (
          <Link
            href={`?q=${searchParams.q || ''}&gradoId=${searchParams.gradoId || ''}&page=${page + 1}`}
            className={styles.pageButton}
          >
            Siguiente →
          </Link>
        )}
      </div>
    </div>
  );
}