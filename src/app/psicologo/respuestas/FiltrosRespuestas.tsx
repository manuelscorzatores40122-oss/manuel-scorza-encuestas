'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import styles from './FiltrosRespuestas.module.css';

type Survey  = { id: string; title: string };
type Grade   = { id: string; name: string; nivel: string };
type Section = { id: string; name: string; gradeId: string };

interface Props {
  surveys:  Survey[];
  grades:   Grade[];
  sections: Section[];
}

export function FiltrosRespuestas({ surveys, grades, sections }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q,         setQ]        = useState(searchParams.get('q')         || '');
  const [surveyId,  setSurvey]   = useState(searchParams.get('surveyId')  || '');
  const [nivel,     setNivel]    = useState(searchParams.get('nivel')     || '');
  const [gradoId,   setGradoId]  = useState(searchParams.get('gradoId')   || '');
  const [sectionId, setSection]  = useState(searchParams.get('sectionId') || '');
  const [riesgo,    setRiesgo]   = useState(searchParams.get('riesgo')    || '');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted   = useRef(false);

  const push = useCallback(
    (overrides: Record<string, string>) => {
      const merged = { q, surveyId, nivel, gradoId, sectionId, riesgo, ...overrides };
      const p = new URLSearchParams();
      if (merged.q)         p.set('q',         merged.q);
      if (merged.surveyId)  p.set('surveyId',  merged.surveyId);
      if (merged.nivel)     p.set('nivel',     merged.nivel);
      if (merged.gradoId)   p.set('gradoId',   merged.gradoId);
      if (merged.sectionId) p.set('sectionId', merged.sectionId);
      if (merged.riesgo)    p.set('riesgo',    merged.riesgo);
      startTransition(() => router.push(`?${p.toString()}`));
    },
    [q, surveyId, nivel, gradoId, sectionId, riesgo, router],
  );

  /* búsqueda por nombre — debounce */
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push({ q }), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  /* opciones en cascada nivel → grado → sección */
  const gradeOptions = nivel
    ? grades.filter(g => g.nivel === nivel)
    : grades;

  const sectionOptions = gradoId
    ? sections.filter(s => s.gradeId === gradoId)
    : nivel
    ? sections.filter(s => grades.find(g => g.id === s.gradeId)?.nivel === nivel)
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
    setSection(val); push({ sectionId: val });
  }
  function handleSurvey(val: string) {
    setSurvey(val); push({ surveyId: val });
  }
  function handleRiesgo(val: string) {
    setRiesgo(val); push({ riesgo: val });
  }

  function clearText() { setQ(''); push({ q: '' }); }
  function clearAll() {
    setQ(''); setSurvey(''); setNivel(''); setGradoId(''); setSection(''); setRiesgo('');
    startTransition(() => router.push('?'));
  }

  const hasFilters = q || surveyId || nivel || gradoId || sectionId || riesgo;

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

      {/* ── Encuesta ── */}
      <select value={surveyId} onChange={(e) => handleSurvey(e.target.value)} className={styles.select}>
        <option value="">Encuesta</option>
        {surveys.map((s) => (
          <option key={s.id} value={s.id}>{s.title}</option>
        ))}
      </select>

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

      {/* ── Sección (solo si hay opciones) ── */}
      {sectionOptions.length > 0 && (
        <select value={sectionId} onChange={(e) => handleSection(e.target.value)} className={styles.select}>
          <option value="">Sección</option>
          {sectionOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}

      {/* ── Riesgo ── */}
      <select value={riesgo} onChange={(e) => handleRiesgo(e.target.value)} className={styles.select}>
        <option value="">Riesgo</option>
        <option value="HIGH">Alto</option>
        <option value="MID">Medio</option>
        <option value="LOW">Bajo</option>
      </select>

      {/* ── Limpiar ── */}
      {hasFilters && (
        <button type="button" onClick={clearAll} className={styles.clearAll}>
          <X className={styles.clearAllIcon} /> Limpiar
        </button>
      )}

    </div>
  );
}
