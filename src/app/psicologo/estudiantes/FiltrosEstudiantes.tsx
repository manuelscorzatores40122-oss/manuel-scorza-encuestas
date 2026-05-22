'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import styles from './FiltrosEstudiantes.module.css';

type Grade   = { id: string; name: string; nivel: string };
type Section = { id: string; name: string; gradeId: string };

interface Props {
  grades:   Grade[];
  sections: Section[];
}

export function FiltrosEstudiantes({ grades, sections }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q,         setQ]        = useState(searchParams.get('q')         || '');
  const [nivel,     setNivel]    = useState(searchParams.get('nivel')     || '');
  const [gradoId,   setGradoId]  = useState(searchParams.get('gradoId')   || '');
  const [sectionId, setSection]  = useState(searchParams.get('sectionId') || '');
  const [riesgo,    setRiesgo]   = useState(searchParams.get('riesgo')    || '');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted   = useRef(false);

  /* construye y navega a la URL con los filtros actuales + overrides */
  const push = useCallback(
    (overrides: Record<string, string>) => {
      const current = { q, nivel, gradoId, sectionId, riesgo };
      const merged  = { ...current, ...overrides };
      const p = new URLSearchParams();
      if (merged.q)         p.set('q',         merged.q);
      if (merged.nivel)     p.set('nivel',     merged.nivel);
      if (merged.gradoId)   p.set('gradoId',   merged.gradoId);
      if (merged.sectionId) p.set('sectionId', merged.sectionId);
      if (merged.riesgo)    p.set('riesgo',    merged.riesgo);
      startTransition(() => router.push(`?${p.toString()}`));
    },
    [q, nivel, gradoId, sectionId, riesgo, router],
  );

  /* texto — debounce 350 ms (no disparar en mount) */
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push({ q }), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  /* opciones derivadas (cascada nivel → grado → sección) */
  const gradeOptions   = nivel    ? grades.filter(g => g.nivel === nivel)     : grades;
  const sectionOptions = gradoId  ? sections.filter(s => s.gradeId === gradoId)
                       : nivel    ? sections.filter(s =>
                           grades.find(g => g.id === s.gradeId)?.nivel === nivel)
                       : sections;

  /* cambios de nivel: resetea grado y sección */
  function handleNivel(val: string) {
    setNivel(val);
    setGradoId('');
    setSection('');
    push({ nivel: val, gradoId: '', sectionId: '' });
  }

  /* cambios de grado: resetea sección */
  function handleGrado(val: string) {
    setGradoId(val);
    setSection('');
    push({ gradoId: val, sectionId: '' });
  }

  /* cambios de sección */
  function handleSection(val: string) {
    setSection(val);
    push({ sectionId: val });
  }

  /* limpiar texto */
  function clearText() {
    setQ('');
    push({ q: '' });
  }

  /* limpiar todo */
  function clearAll() {
    setQ(''); setNivel(''); setGradoId(''); setSection(''); setRiesgo('');
    startTransition(() => router.push('?'));
  }

  const hasFilters = q || nivel || gradoId || sectionId || riesgo;

  return (
    <div className={styles.bar}>

      {/* ── Buscador por nombre ── */}
      <div className={styles.searchWrap}>
        {isPending
          ? <Loader2 className={`${styles.searchIcon} ${styles.spin}`} />
          : <Search  className={styles.searchIcon} />
        }
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o apellido…"
          className={styles.searchInput}
          autoComplete="off"
        />
        {q && (
          <button type="button" onClick={clearText} className={styles.clearInput} aria-label="Limpiar">
            <X className={styles.clearIcon} />
          </button>
        )}
      </div>

      {/* ── Nivel ── */}
      <select value={nivel} onChange={(e) => handleNivel(e.target.value)} className={styles.select}>
        <option value="">Nivel</option>
        <option value="PRIMARIA">Primaria</option>
        <option value="SECUNDARIA">Secundaria</option>
      </select>

      {/* ── Grado ── */}
      <select value={gradoId} onChange={(e) => handleGrado(e.target.value)} className={styles.select}>
        <option value="">Grado</option>
        {gradeOptions.map((g) => (
          <option key={g.id} value={g.id}>
            {g.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'} {g.name}
          </option>
        ))}
      </select>

      {/* ── Sección (solo si hay opciones disponibles) ── */}
      {sectionOptions.length > 0 && (
        <select value={sectionId} onChange={(e) => handleSection(e.target.value)} className={styles.select}>
          <option value="">Sección</option>
          {sectionOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}

      {/* ── Riesgo ── */}
      <select
        value={riesgo}
        onChange={(e) => { setRiesgo(e.target.value); push({ riesgo: e.target.value }); }}
        className={styles.select}
      >
        <option value="">Riesgo</option>
        <option value="HIGH">Alto</option>
        <option value="MID">Medio</option>
        <option value="LOW">Bajo</option>
      </select>

      {/* ── Limpiar todo ── */}
      {hasFilters && (
        <button type="button" onClick={clearAll} className={styles.clearAll}>
          <X className={styles.clearAllIcon} /> Limpiar
        </button>
      )}

    </div>
  );
}
