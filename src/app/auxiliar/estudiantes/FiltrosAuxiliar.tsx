'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import styles from './estudiantes.module.css';

type Grade   = { id: string; name: string; nivel: string };
type Section = { id: string; name: string; gradeId: string; grade: { name: string; nivel: string } };

export function FiltrosAuxiliar({
  grades,
  sections,
  defaultQ         = '',
  defaultNivel     = '',
  defaultGradoId   = '',
  defaultSeccionId = '',
}: {
  grades:           Grade[];
  sections:         Section[];
  defaultQ?:        string;
  defaultNivel?:    string;
  defaultGradoId?:  string;
  defaultSeccionId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [q,         setQ]         = useState(defaultQ);
  const [nivel,     setNivel]     = useState(defaultNivel);
  const [gradoId,   setGradoId]   = useState(defaultGradoId);
  const [seccionId, setSeccionId] = useState(defaultSeccionId);

  const gradosFiltrados = nivel ? grades.filter(g => g.nivel === nivel) : grades;
  const seccionesFiltradas = gradoId
    ? sections.filter(s => s.gradeId === gradoId)
    : nivel
      ? sections.filter(s => s.grade.nivel === nivel)
      : sections;

  function push(overrides: Partial<{ q: string; nivel: string; gradoId: string; seccionId: string }>) {
    const merged = { q, nivel, gradoId, seccionId, ...overrides };
    const params = new URLSearchParams();
    if (merged.q)         params.set('q',         merged.q);
    if (merged.nivel)     params.set('nivel',     merged.nivel);
    if (merged.gradoId)   params.set('gradoId',   merged.gradoId);
    if (merged.seccionId) params.set('seccionId', merged.seccionId);
    startTransition(() => router.push(`/auxiliar/estudiantes?${params}`));
  }

  function onNivel(val: string)   { setNivel(val); setGradoId(''); setSeccionId(''); push({ nivel: val, gradoId: '', seccionId: '' }); }
  function onGrado(val: string)   { setGradoId(val); setSeccionId(''); push({ gradoId: val, seccionId: '' }); }
  function onSeccion(val: string) { setSeccionId(val); push({ seccionId: val }); }
  function onSearch()             { push({}); }
  function onClear()              { setQ(''); setNivel(''); setGradoId(''); setSeccionId(''); router.push('/auxiliar/estudiantes'); }

  const hasFilter = !!(q || nivel || gradoId || seccionId);

  return (
    <div className={`${styles.filterForm} ${isPending ? styles.filterPending : ''}`}>

      {/* Búsqueda de texto */}
      <div className={styles.filterRow}>
        <div className={styles.filterGroup} style={{ flex: 1 }}>
          <span className={styles.filterLabel}>Buscar</span>
          <div className={styles.filterSearchWrap}>
            <Search size={14} className={styles.filterIcon} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSearch()}
              className={styles.filterInput}
              placeholder="Nombre, apellido, DNI o código de estudiante…"
              autoComplete="off"
            />
            {q && (
              <button type="button" className={styles.filterInputClear} onClick={() => { setQ(''); push({ q: '' }); }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>
        <div className={styles.filterActions}>
          <button type="button" className={styles.filterBtn} onClick={onSearch} disabled={isPending}>
            {isPending ? 'Buscando…' : 'Buscar'}
          </button>
          {hasFilter && (
            <button type="button" className={styles.filterClear} onClick={onClear}>Limpiar</button>
          )}
        </div>
      </div>

      {/* Selects en cascada */}
      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Nivel</span>
          <select value={nivel} onChange={e => onNivel(e.target.value)} className={styles.filterSelect}>
            <option value="">Todos</option>
            <option value="PRIMARIA">Primaria</option>
            <option value="SECUNDARIA">Secundaria</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>
            Grado
            {nivel && <span className={styles.filterLabelHint}> · {nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'}</span>}
          </span>
          <select value={gradoId} onChange={e => onGrado(e.target.value)} className={styles.filterSelect} disabled={gradosFiltrados.length === 0}>
            <option value="">Todos</option>
            {gradosFiltrados.map(g => (
              <option key={g.id} value={g.id}>
                {!nivel && (g.nivel === 'PRIMARIA' ? 'Pri. ' : 'Sec. ')}{g.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>
            Sección
            {gradoId && <span className={styles.filterLabelHint}> · {gradosFiltrados.find(g => g.id === gradoId)?.name}</span>}
          </span>
          <select value={seccionId} onChange={e => onSeccion(e.target.value)} className={styles.filterSelect} disabled={seccionesFiltradas.length === 0}>
            <option value="">Todas</option>
            {seccionesFiltradas.map(s => (
              <option key={s.id} value={s.id}>
                {gradoId ? `Sección ${s.name}` : nivel ? `${s.grade.name} — ${s.name}` : `${s.grade.nivel === 'PRIMARIA' ? 'Pri.' : 'Sec.'} ${s.grade.name} — ${s.name}`}
              </option>
            ))}
          </select>
        </div>

        {hasFilter && (
          <div className={styles.filterChips}>
            {nivel && <span className={styles.chip}>{nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'}<button onClick={() => onNivel('')}><X size={11} /></button></span>}
            {gradoId && <span className={styles.chip}>{gradosFiltrados.find(g => g.id === gradoId)?.name ?? 'Grado'}<button onClick={() => onGrado('')}><X size={11} /></button></span>}
            {seccionId && <span className={styles.chip}>Secc. {seccionesFiltradas.find(s => s.id === seccionId)?.name ?? '?'}<button onClick={() => onSeccion('')}><X size={11} /></button></span>}
          </div>
        )}
      </div>
    </div>
  );
}
