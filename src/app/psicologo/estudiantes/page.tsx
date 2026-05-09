import Link from 'next/link';
import { Users, Search } from 'lucide-react';
import { prisma } from '@/lib/prisma';

import styles from './page.module.css';

export default async function EstudiantesPsicologo({
  searchParams,
}: {
  searchParams: { q?: string; gradoId?: string };
}) {
  const where: any = { estadoMatricula: 'DEFINITIVA' };

  if (searchParams.q) {
    where.OR = [
      { nombres: { contains: searchParams.q.toUpperCase() } },
      { apellidoPaterno: { contains: searchParams.q.toUpperCase() } },
      { apellidoMaterno: { contains: searchParams.q.toUpperCase() } },
    ];
  }

  if (searchParams.gradoId) {
    where.section = { gradeId: searchParams.gradoId };
  }

  const [students, grades] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        section: { include: { grade: true } },
        apoderados: true,
        _count: { select: { responses: true } },
      },
      orderBy: [{ apellidoPaterno: 'asc' }],
      take: 200,
    }),
    prisma.grade.findMany({
      orderBy: [{ nivel: 'asc' }, { order: 'asc' }],
    }),
  ]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <Users className={styles.titleIcon} />
        Estudiantes
      </h1>

      <form className={styles.filters}>
        <div className={styles.searchGroup}>
          <label className={styles.label}>
            Buscar por nombre o apellido
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

        <div>
          <label className={styles.label}>Grado</label>

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

        <button className={styles.button} type="submit">
          Filtrar
        </button>
      </form>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th>Apellidos y nombres</th>
              <th>Grado</th>
              <th>Emergencia</th>
              <th className={styles.center}>Edad</th>
              <th className={styles.center}>Respuestas</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {students.map((s) => {
              const emergency =
                s.apoderados.find((a) => a.esContactoPrincipal) ||
                s.apoderados.find((a) => a.parentesco === 'APODERADO') ||
                s.apoderados[0];

              return (
                <tr key={s.id} className={styles.row}>
                  <td className={styles.studentName}>
                    {s.apellidoPaterno} {s.apellidoMaterno}, {s.nombres}
                  </td>

                  <td className={styles.smallText}>
                    {s.section.grade.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'}{' '}
                    {s.section.grade.name} {s.section.name}
                  </td>

                  <td className={styles.smallText}>
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
                  </td>

                  <td className={styles.center}>{s.edad}</td>
                  <td className={styles.center}>{s._count.responses}</td>

                  <td className={styles.right}>
                    <Link
                      href={`/psicologo/estudiantes/${s.id}`}
                      className={styles.historyLink}
                    >
                      Histórico →
                    </Link>
                  </td>
                </tr>
              );
            })}

            {students.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  No hay estudiantes que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 