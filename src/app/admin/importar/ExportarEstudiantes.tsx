'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import styles from './ExportarEstudiantes.module.css';

interface Grade   { id: string; name: string; nivel: string; order: number }
interface Section { id: string; name: string; gradeId: string }

interface Props { grades: Grade[]; sections: Section[]; total: number }

export function ExportarEstudiantes({ grades, sections, total }: Props) {
  const [nivel,     setNivel]   = useState('');
  const [gradoId,   setGradoId] = useState('');
  const [seccionId, setSeccion] = useState('');
  const [estado,    setEstado]  = useState('');
  const [anio,      setAnio]    = useState('');
  const [formato,   setFormato] = useState('xlsx');

  const gradosFiltrados    = nivel    ? grades.filter(g => g.nivel === nivel)       : grades;
  const seccionesFiltradas = gradoId  ? sections.filter(s => s.gradeId === gradoId) : sections;

  function buildURL() {
    const p = new URLSearchParams();
    if (nivel)     p.set('nivel',     nivel);
    if (gradoId)   p.set('gradoId',   gradoId);
    if (seccionId) p.set('seccionId', seccionId);
    if (estado)    p.set('estado',    estado);
    if (anio)      p.set('anio',      anio);
    p.set('formato', formato);
    return `/api/export/students?${p.toString()}`;
  }

  function handleNivel(v: string) { setNivel(v); setGradoId(''); setSeccion(''); }
  function handleGrado(v: string) { setGradoId(v); setSeccion(''); }

  return (
    <div className={styles.box}>
      <div className={styles.countRow}>
        <FileSpreadsheet style={{ width: 14, height: 14 }} strokeWidth={1.6} />
        <span>{total} estudiante{total !== 1 ? 's' : ''} en la base de datos</span>
      </div>

      <div className={styles.filterGrid}>
        <div className={styles.fieldWrap}>
          <label className={styles.label}>Nivel</label>
          <select className={styles.input} value={nivel} onChange={e => handleNivel(e.target.value)}>
            <option value="">Todos</option>
            <option value="PRIMARIA">Primaria</option>
            <option value="SECUNDARIA">Secundaria</option>
          </select>
        </div>

        <div className={styles.fieldWrap}>
          <label className={styles.label}>Grado</label>
          <select className={styles.input} value={gradoId} onChange={e => handleGrado(e.target.value)}>
            <option value="">Todos</option>
            {gradosFiltrados.sort((a, b) => a.order - b.order).map(g => (
              <option key={g.id} value={g.id}>
                {g.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'} {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldWrap}>
          <label className={styles.label}>Sección</label>
          <select className={styles.input} value={seccionId} onChange={e => setSeccion(e.target.value)}>
            <option value="">Todas</option>
            {seccionesFiltradas.sort((a, b) => a.name.localeCompare(b.name)).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.fieldWrap}>
          <label className={styles.label}>Estado matrícula</label>
          <select className={styles.input} value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="DEFINITIVA">Definitiva</option>
            <option value="RETIRADO">Retirado</option>
            <option value="EGRESADO">Egresado</option>
            <option value="TRASLADADO">Trasladado</option>
          </select>
        </div>

        <div className={styles.fieldWrap}>
          <label className={styles.label}>Año académico</label>
          <input
            type="number"
            className={styles.input}
            placeholder="Todos"
            value={anio}
            min={2020} max={2035}
            onChange={e => setAnio(e.target.value)}
          />
        </div>

        <div className={styles.fieldWrap}>
          <label className={styles.label}>Formato</label>
          <select className={styles.input} value={formato} onChange={e => setFormato(e.target.value)}>
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV (.csv)</option>
          </select>
        </div>
      </div>

      <a href={buildURL()} download className={styles.btnExport}>
        <Download style={{ width: 14, height: 14 }} strokeWidth={2} />
        Exportar estudiantes
      </a>
    </div>
  );
}
