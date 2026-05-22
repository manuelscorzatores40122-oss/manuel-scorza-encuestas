'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, GraduationCap, Phone, ArrowRight } from 'lucide-react';
import styles from './BuscadorEstudiantes.module.css';

type Result = {
  id: string;
  name: string;
  grade: string;
  nivel: string;
  contactoNombre:     string | null;
  contactoCelular:    string | null;
  contactoParentesco: string | null;
};

export function BuscadorEstudiantes() {
  const router = useRouter();
  const [q,         setQ]        = useState('');
  const [results,   setResults]  = useState<Result[]>([]);
  const [loading,   setLoading]  = useState(false);
  const [open,      setOpen]     = useState(false);
  const [activeIdx, setActive]   = useState(-1);
  const [, startTransition] = useTransition();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  /* fetch con debounce */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/psicologo/buscar-alumnos?q=${encodeURIComponent(q)}`);
        const data: Result[] = await res.json();
        setResults(data);
        setOpen(true);
        setActive(-1);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q]);

  /* cerrar al hacer clic fuera */
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function navigate(id: string) {
    setOpen(false);
    setQ('');
    startTransition(() => router.push(`/psicologo/estudiantes/${id}`));
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive((i) => Math.max(i - 1, -1)); }
    if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); navigate(results[activeIdx].id); }
    if (e.key === 'Escape')    { setOpen(false); setQ(''); inputRef.current?.blur(); }
  }

  return (
    <div ref={wrapRef} className={styles.wrap}>

      {/* Input */}
      <div className={styles.inputRow}>
        {loading
          ? <Loader2 className={`${styles.leadIcon} ${styles.spin}`} />
          : <Search  className={styles.leadIcon} />
        }
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar alumno por nombre o apellido…"
          className={styles.input}
          autoComplete="off"
          spellCheck={false}
        />
        {q && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => { setQ(''); setOpen(false); inputRef.current?.focus(); }}
            tabIndex={-1}
          >
            ESC
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className={styles.dropdown}>
          {results.length > 0 ? (
            <>
              {results.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  className={`${styles.item} ${i === activeIdx ? styles.itemActive : ''}`}
                  onClick={() => navigate(r.id)}
                  onMouseEnter={() => setActive(i)}
                >
                  <GraduationCap className={styles.itemIcon} />

                  {/* Datos del alumno */}
                  <span className={styles.itemBody}>
                    <span className={styles.itemName}>{r.name}</span>
                    <span className={styles.itemGrade}>{r.grade}</span>
                  </span>

                  {/* Datos del apoderado */}
                  {r.contactoNombre && (
                    <span className={styles.itemContact}>
                      <span className={styles.itemContactName}>
                        {r.contactoNombre.split(' ').slice(0, 3).join(' ')}
                        {r.contactoParentesco && (
                          <span className={styles.itemParentesco}>
                            {' '}· {r.contactoParentesco}
                          </span>
                        )}
                      </span>
                      {r.contactoCelular && (
                        <span className={styles.itemPhone}>
                          <Phone className={styles.phoneIcon} />
                          {r.contactoCelular}
                        </span>
                      )}
                    </span>
                  )}

                  <span className={styles.itemNivel} data-nivel={r.nivel}>
                    {r.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'}
                  </span>
                  <ArrowRight className={styles.itemArrow} />
                </button>
              ))}
              <div className={styles.dropdownFooter}>
                <span>↑↓ navegar · Enter seleccionar · Esc cerrar</span>
              </div>
            </>
          ) : (
            <p className={styles.noResults}>Sin resultados para &ldquo;{q}&rdquo;</p>
          )}
        </div>
      )}

    </div>
  );
}
