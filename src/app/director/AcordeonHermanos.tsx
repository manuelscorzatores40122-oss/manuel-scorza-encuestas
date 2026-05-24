'use client';

import { useState } from 'react';
import { ChevronDown, Heart, Phone } from 'lucide-react';
import styles from './dashboard.module.css';

export type SiblingGroup = {
  celular: string;
  apoderado: string;
  students: { estudiante: string; grado: string; seccion: string; nivel: string }[];
};

export function AcordeonHermanos({
  groups,
  totalHermanos,
  totalFamilias,
}: {
  groups: SiblingGroup[];
  totalHermanos: number;
  totalFamilias: number;
}) {
  const [expanded, setExpanded]   = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <div className={styles.siblingCard}>

      {/* ── Cabecera / trigger principal ── */}
      <button
        type="button"
        className={styles.siblingTrigger}
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        <div className={styles.siblingHeader}>
          <div className={styles.siblingIcon}>
            <Heart size={18} />
          </div>
          <div className={styles.siblingBody}>
            <div className={styles.siblingLabel}>Hermanos matriculados</div>
            <div className={styles.siblingRow}>
              <div className={styles.siblingStat}>
                <span className={styles.siblingNum}>{totalHermanos}</span>
                <span className={styles.siblingDesc}>estudiantes con hermano en el colegio</span>
              </div>
              <div className={styles.siblingDivider} />
              <div className={styles.siblingStat}>
                <span className={styles.siblingNum}>{totalFamilias}</span>
                <span className={styles.siblingDesc}>familias con más de un hijo matriculado</span>
              </div>
            </div>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`${styles.siblingChevron} ${expanded ? styles.siblingChevronOpen : ''}`}
        />
      </button>

      {/* ── Lista de familias (acordeón interno) ── */}
      <div className={`${styles.siblingPanel} ${expanded ? styles.siblingPanelOpen : ''}`}>
        <div className={styles.siblingPanelInner}>
          {groups.length === 0 ? (
            <div className={styles.siblingEmpty}>Sin grupos de hermanos registrados.</div>
          ) : (
            <div className={styles.accordion}>
              {groups.map((g) => {
                const isOpen = openGroup === g.celular;
                return (
                  <div key={g.celular} className={styles.accordionItem}>
                    <button
                      type="button"
                      className={styles.accordionTrigger}
                      onClick={() => setOpenGroup(isOpen ? null : g.celular)}
                      aria-expanded={isOpen}
                    >
                      <span className={styles.accordionLeft}>
                        <span className={styles.accordionApoderado}>{g.apoderado}</span>
                        <span className={styles.accordionBadge}>{g.students.length} hijos</span>
                      </span>
                      <ChevronDown
                        size={15}
                        className={`${styles.accordionChevron} ${isOpen ? styles.accordionChevronOpen : ''}`}
                      />
                    </button>

                    <div className={`${styles.accordionBody} ${isOpen ? styles.accordionBodyOpen : ''}`}>
                      <div className={styles.accordionBodyInner}>
                        {g.students.map((s, i) => (
                          <div key={i} className={styles.accordionStudent}>
                            <span className={styles.accordionName}>{s.estudiante}</span>
                            <span className={styles.accordionGrade}>
                              {s.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'} · {s.grado} {s.seccion}
                            </span>
                          </div>
                        ))}
                        <div className={styles.accordionPhone}>
                          <Phone size={12} />
                          {g.celular}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
