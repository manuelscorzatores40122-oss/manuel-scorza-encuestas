'use client';

import { useState } from 'react';
import { ChevronDown, Phone, Mail } from 'lucide-react';
import type { Prisma } from '@prisma/client';
import styles from './estudiantes.module.css';

export type StudentRow = Prisma.StudentGetPayload<{
  include: {
    section: { include: { grade: true } };
    apoderados: true;
  };
}>;

const PARENTESCO: Record<string, string> = {
  PADRE:     'Padre',
  MADRE:     'Madre',
  APODERADO: 'Apoderado',
  OTRO:      'Otro',
};

const ESTADO: Record<string, string> = {
  DEFINITIVA:  'Definitiva',
  RETIRADO:    'Retirado',
  EGRESADO:    'Egresado',
  TRASLADADO:  'Trasladado',
};

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function TablaEstudiantes({ students }: { students: StudentRow[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (students.length === 0) {
    return <div className={styles.tableWrap}><div className={styles.empty}>No hay estudiantes que coincidan con los filtros.</div></div>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Estudiante</th>
            <th className={styles.th}>Documento</th>
            <th className={styles.th}>Sexo / Edad</th>
            <th className={styles.th}>Nivel · Grado · Sección</th>
            <th className={`${styles.th} ${styles.thRight}`}></th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => {
            const isOpen = expanded.has(s.id);
            const nivel  = s.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria';

            return (
              <>
                <tr
                  key={s.id}
                  className={`${styles.tr} ${isOpen ? styles.trOpen : ''}`}
                  onClick={() => toggle(s.id)}
                >
                  <td className={`${styles.td} ${styles.tdName}`}>
                    {s.apellidoPaterno} {s.apellidoMaterno}, {s.nombres}
                    {s.codigoEstudiante && (
                      <div className={styles.tdSub}>Cód. {s.codigoEstudiante}</div>
                    )}
                  </td>

                  <td className={`${styles.td} ${styles.tdDoc}`}>{s.dni}</td>

                  <td className={styles.td}>
                    {s.sexo === 'M' ? 'Masculino' : 'Femenino'}
                    <div className={styles.tdSub}>{s.edad} años</div>
                  </td>

                  <td className={styles.td}>
                    {nivel} · {s.section.grade.name}
                    <div className={styles.tdSub}>Sección {s.section.name}</div>
                  </td>

                  <td className={styles.td}>
                    <ChevronDown
                      size={15}
                      className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                    />
                  </td>
                </tr>

                {/* Panel expandido */}
                <tr key={`${s.id}-detail`} className={styles.trExpanded}>
                  <td colSpan={5} className={styles.tdExpanded}>
                    <div className={`${styles.expandPanel} ${isOpen ? styles.expandPanelOpen : ''}`}>
                      <div className={styles.expandInner}>
                        <div className={styles.expandBody}>

                          {/* Columna 1: datos personales y académicos */}
                          <div className={styles.expandSection}>
                            <div className={styles.expandTitle}>Datos personales y académicos</div>
                            <div className={styles.fieldGrid}>
                              <div className={styles.field}>
                                <span className={styles.fieldLabel}>F. nacimiento</span>
                                <span className={styles.fieldValue}>{fmtDate(s.fechaNacimiento)}</span>
                              </div>
                              <div className={styles.field}>
                                <span className={styles.fieldLabel}>Edad</span>
                                <span className={styles.fieldValue}>{s.edad} años</span>
                              </div>
                              <div className={styles.field}>
                                <span className={styles.fieldLabel}>Sexo</span>
                                <span className={styles.fieldValue}>{s.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>
                              </div>
                              <div className={styles.field}>
                                <span className={styles.fieldLabel}>DNI / CE</span>
                                <span className={styles.fieldValue}>{s.dni}</span>
                              </div>
                              <div className={styles.field}>
                                <span className={styles.fieldLabel}>Código</span>
                                <span className={styles.fieldValue}>{s.codigoEstudiante || '—'}</span>
                              </div>
                              <div className={styles.field}>
                                <span className={styles.fieldLabel}>Estado</span>
                                <span className={styles.fieldValue}>{ESTADO[s.estadoMatricula] ?? s.estadoMatricula}</span>
                              </div>
                              <div className={styles.field}>
                                <span className={styles.fieldLabel}>Año académico</span>
                                <span className={styles.fieldValue}>{s.anioAcademico}</span>
                              </div>
                              <div className={styles.field}>
                                <span className={styles.fieldLabel}>Nivel</span>
                                <span className={styles.fieldValue}>{nivel}</span>
                              </div>
                              <div className={styles.field}>
                                <span className={styles.fieldLabel}>Grado</span>
                                <span className={styles.fieldValue}>{s.section.grade.name}</span>
                              </div>
                              <div className={styles.field}>
                                <span className={styles.fieldLabel}>Sección</span>
                                <span className={styles.fieldValue}>{s.section.name}</span>
                              </div>
                            </div>
                          </div>

                          {/* Columna 2: apoderados */}
                          <div className={styles.expandSection}>
                            <div className={styles.expandTitle}>
                              Apoderados ({s.apoderados.length})
                            </div>

                            {s.apoderados.length === 0 ? (
                              <div className={styles.noApoderado}>Sin apoderado registrado.</div>
                            ) : (
                              <div className={styles.apoderadoList}>
                                {s.apoderados.map(a => (
                                  <div key={a.id} className={styles.apoderado}>
                                    <div className={styles.apoderadoName}>{a.apellidosNombres}</div>
                                    <div className={styles.apoderadoMeta}>
                                      <span className={`${styles.apoderadoTag} ${a.esContactoPrincipal ? styles.apoderadoTagPrincipal : ''}`}>
                                        {a.esContactoPrincipal ? 'Contacto principal' : PARENTESCO[a.parentesco] ?? a.parentesco}
                                      </span>
                                      {!a.esContactoPrincipal && (
                                        <span>{PARENTESCO[a.parentesco] ?? a.parentesco}</span>
                                      )}
                                      {a.tipoDocumento && a.numeroDocumento && (
                                        <span>{a.tipoDocumento} {a.numeroDocumento}</span>
                                      )}
                                    </div>
                                    <div className={styles.apoderadoContact}>
                                      {a.celular && (
                                        <span className={styles.apoderadoContactItem}>
                                          <Phone size={12} /> {a.celular}
                                        </span>
                                      )}
                                      {a.correo && (
                                        <span className={styles.apoderadoContactItem}>
                                          <Mail size={12} /> {a.correo}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
