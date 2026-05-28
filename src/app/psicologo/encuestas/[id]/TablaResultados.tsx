'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { RiskBadge } from '@/components/EtiquetaRiesgo';
import { formatDateTime } from '@/lib/utils';
import styles from './page.module.css';

const PAGE_SIZE = 10;

type Response = {
  id: string;
  riskLevel: string;
  riskScore: number;
  submittedAt: string;
  student: {
    nombres:        string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    section: { name: string; grade: { name: string } };
  };
};

type Pending = {
  id: string;
  nombres:        string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  edad:   number | null;
  section: { name: string; grade: { name: string } };
};

export function TablaResultados({
  responses,
  pending,
  hasFilter,
}: {
  responses: Response[];
  pending:   Pending[];
  hasFilter: boolean;
}) {
  const [pageR, setPageR] = useState(0);
  const [pageP, setPageP] = useState(0);

  const totalR = Math.ceil(responses.length / PAGE_SIZE);
  const totalP = Math.ceil(pending.length   / PAGE_SIZE);

  const pageResponses = responses.slice(pageR * PAGE_SIZE, (pageR + 1) * PAGE_SIZE);
  const pagePending   = pending.slice  (pageP * PAGE_SIZE, (pageP + 1) * PAGE_SIZE);

  return (
    <>
      {/* ── Respondieron ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <CheckCircle2 className={styles.sectionIcon} />
          Respondieron
          <span className={styles.sectionCount}>{responses.length}</span>
        </h2>

        <div className={styles.tableCard}>
          {responses.length > 0 ? (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Estudiante</th>
                    <th className={styles.th}>Grado / Secc.</th>
                    <th className={`${styles.th} ${styles.thCenter}`}>Riesgo</th>
                    <th className={`${styles.th} ${styles.thCenter}`}>Score</th>
                    <th className={styles.th}>Fecha</th>
                    <th className={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {pageResponses.map(r => (
                    <tr key={r.id} className={styles.row}>
                      <td className={styles.tdName}>
                        {r.student.apellidoPaterno} {r.student.apellidoMaterno},{' '}
                        {r.student.nombres}
                      </td>
                      <td className={styles.td}>
                        {r.student.section.grade.name} — {r.student.section.name}
                      </td>
                      <td className={`${styles.td} ${styles.tdCenter}`}>
                        <RiskBadge level={r.riskLevel} />
                      </td>
                      <td className={`${styles.td} ${styles.tdCenter}`}>
                        {r.riskScore}
                      </td>
                      <td className={styles.td}>
                        {formatDateTime(r.submittedAt)}
                      </td>
                      <td className={styles.td}>
                        <Link href={`/psicologo/respuestas/${r.id}`} className={styles.viewLink}>
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalR > 1 && (
                <Paginador page={pageR} total={totalR} onChange={p => { setPageR(p); }} />
              )}
            </>
          ) : (
            <p className={styles.emptyMsg}>
              {hasFilter
                ? 'Ningún estudiante con esos filtros ha respondido.'
                : 'Ningún estudiante ha respondido aún.'}
            </p>
          )}
        </div>
      </section>

      {/* ── Pendientes ── */}
      {(pending.length > 0 || hasFilter) && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Clock className={styles.sectionIconMuted} />
            Pendientes
            <span className={styles.sectionCountMuted}>{pending.length}</span>
          </h2>

          <div className={styles.tableCard}>
            {pending.length > 0 ? (
              <>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Estudiante</th>
                      <th className={styles.th}>Grado / Secc.</th>
                      <th className={`${styles.th} ${styles.thCenter}`}>Edad</th>
                      <th className={styles.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagePending.map(s => (
                      <tr key={s.id} className={styles.row}>
                        <td className={styles.tdName}>
                          {s.apellidoPaterno} {s.apellidoMaterno}, {s.nombres}
                        </td>
                        <td className={styles.td}>
                          {s.section.grade.name} — {s.section.name}
                        </td>
                        <td className={`${styles.td} ${styles.tdCenter}`}>{s.edad}</td>
                        <td className={styles.td}>
                          <Link
                            href={`/psicologo/estudiantes/${s.id}`}
                            className={styles.viewLink}
                          >
                            Ver alumno →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalP > 1 && (
                  <Paginador page={pageP} total={totalP} onChange={p => { setPageP(p); }} />
                )}
              </>
            ) : (
              <p className={styles.emptyMsg}>
                Todos los estudiantes con esos filtros ya respondieron.
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}

function Paginador({
  page,
  total,
  onChange,
}: {
  page:     number;
  total:    number;
  onChange: (p: number) => void;
}) {
  return (
    <div className={styles.paginador}>
      <button
        type="button"
        className={styles.pgBtn}
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={14} />
      </button>
      <span className={styles.pgInfo}>
        {page + 1} / {total}
      </span>
      <button
        type="button"
        className={styles.pgBtn}
        disabled={page >= total - 1}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
