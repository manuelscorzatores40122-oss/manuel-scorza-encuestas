'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import styles from './FiltrosEncuesta.module.css';

type Grade   = { id: string; name: string; nivel: string };
type Section = { id: string; name: string; gradeId: string };

interface Props {
  grades:   Grade[];
  sections: Section[];
}

export function FiltrosEncuesta({ grades, sections }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q,         setQ]       = useState(searchParams.get('q')         || '');
  const [nivel,     setNivel]   = useState(searchParams.get('nivel')     || '');
  const [gradoId,   setGradoId] = useState(searchParams.get('gradoId')   || '');
  const [sectionId, setSection] = useState(searchParams.get('sectionId') || '');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted   = useRef(false);

  const push = useCallback(
    (overrides: Record<string, string>) => {
      const merged = { q, nivel, gradoId, sectionId, ...overrides };
      const p = new URLSearchParams();
      if (merged.q)         p.set('q',         merged.q);
      if (merged.nivel)     p.set('nivel',     merged.nivel);
      if (merged.gradoId)   p.set('gradoId',   merged.gradoId);
      if (merged.sectionId) p.set('sectionId', merged.sectionId);
      startTransition(() => router.push(`?${p.toString()}`));
    },
    [q, nivel, gradoId, sectionId, router],
  );

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push({ q }), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const gradeOptions   = nivel   ? grades.filter(g => g.nivel === nivel) : grades;
  const sectionOptions = gradoId ? sections.filter(s => s.gradeId === gradoId)
                       : nivel   ? sections.filter(s => grades.find(g => g.id === s.gradeId)?.nivel === nivel)
                       : sections;

  function handleNivel(val: string) {
    setNivel(val); setGradoId(''); setSection('');
    push({ nivel: val, gradoId: '', sectionId: '' });
  }

  function handleGrado(val: string) {
    setGradoId(val); setSection('');
    push({ gradoId: val, sectionId: '' });
  }

  function handleSection(val: string) {
    setSection(val);
    push({ sectionId: val });
  }

  function clearText() { setQ(''); push({ q: '' }); }

  function clearAll() {
    setQ(''); setNivel(''); setGradoId(''); setSection('');
    startTransition(() => router.push('?'));
  }

  const hasFilters = q || nivel || gradoId || sectionId;

  return (
    <div className={styles.bar}>

      <div className={styles.searchWrap}>
        {isPending
          ? <Loader2 className={`${styles.searchIcon} ${styles.spin}`} />
          : <Search  className={styles.searchIcon} />
        }
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar estudiante…"
          className={styles.searchInput}
          autoComplete="off"
        />
        {q && (
          <button type="button" onClick={clearText} className={styles.clearInput} aria-label="Limpiar">
            <X className={styles.clearIcon} />
          </button>
        )}
      </div>

      <select value={nivel} onChange={(e) => handleNivel(e.target.value)} className={styles.select}>
        <option value="">Nivel</option>
        <option value="PRIMARIA">Primaria</option>
        <option value="SECUNDARIA">Secundaria</option>
      </select>

      <select value={gradoId} onChange={(e) => handleGrado(e.target.value)} className={styles.select}>
        <option value="">Grado</option>
        {gradeOptions.map((g) => (
          <option key={g.id} value={g.id}>
            {g.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'} {g.name}
          </option>
        ))}
      </select>

      {sectionOptions.length > 0 && (
        <select value={sectionId} onChange={(e) => handleSection(e.target.value)} className={styles.select}>
          <option value="">Sección</option>
          {sectionOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}

      {hasFilters && (
        <button type="button" onClick={clearAll} className={styles.clearAll}>
          <X className={styles.clearAllIcon} /> Limpiar
        </button>
      )}

    </div>
  );
}
