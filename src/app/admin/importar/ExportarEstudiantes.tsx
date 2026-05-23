'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';

interface Grade   { id: string; name: string; nivel: string; order: number }
interface Section { id: string; name: string; gradeId: string }

interface Props {
  grades:   Grade[];
  sections: Section[];
  total:    number;
}

export function ExportarEstudiantes({ grades, sections, total }: Props) {
  const [nivel,     setNivel]    = useState('');
  const [gradoId,   setGradoId]  = useState('');
  const [seccionId, setSeccion]  = useState('');
  const [estado,    setEstado]   = useState('');
  const [anio,      setAnio]     = useState('');
  const [formato,   setFormato]  = useState('xlsx');

  const gradosFiltrados   = nivel ? grades.filter(g => g.nivel === nivel) : grades;
  const seccionesFiltradas = gradoId ? sections.filter(s => s.gradeId === gradoId) : sections;

  function buildURL() {
    const p = new URLSearchParams();
    if (nivel)     p.set('nivel',    nivel);
    if (gradoId)   p.set('gradoId',  gradoId);
    if (seccionId) p.set('seccionId',seccionId);
    if (estado)    p.set('estado',   estado);
    if (anio)      p.set('anio',     anio);
    p.set('formato', formato);
    return `/api/export/students?${p.toString()}`;
  }

  // Limpiar dependencias en cascada
  function handleNivel(v: string) {
    setNivel(v);
    setGradoId('');
    setSeccion('');
  }
  function handleGrado(v: string) {
    setGradoId(v);
    setSeccion('');
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <FileSpreadsheet className="w-4 h-4 text-slate-500" />
        <span className="text-xs text-slate-500">
          {total} estudiante{total !== 1 ? 's' : ''} en la base de datos
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Nivel */}
        <div>
          <label className="label text-xs">Nivel</label>
          <select className="input" value={nivel} onChange={e => handleNivel(e.target.value)}>
            <option value="">Todos</option>
            <option value="PRIMARIA">Primaria</option>
            <option value="SECUNDARIA">Secundaria</option>
          </select>
        </div>

        {/* Grado */}
        <div>
          <label className="label text-xs">Grado</label>
          <select className="input" value={gradoId} onChange={e => handleGrado(e.target.value)}>
            <option value="">Todos</option>
            {gradosFiltrados
              .sort((a, b) => a.order - b.order)
              .map(g => (
                <option key={g.id} value={g.id}>
                  {g.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'} {g.name}
                </option>
              ))}
          </select>
        </div>

        {/* Sección */}
        <div>
          <label className="label text-xs">Sección</label>
          <select className="input" value={seccionId} onChange={e => setSeccion(e.target.value)}>
            <option value="">Todas</option>
            {seccionesFiltradas
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
          </select>
        </div>

        {/* Estado */}
        <div>
          <label className="label text-xs">Estado matrícula</label>
          <select className="input" value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="DEFINITIVA">Definitiva</option>
            <option value="RETIRADO">Retirado</option>
            <option value="EGRESADO">Egresado</option>
            <option value="TRASLADADO">Trasladado</option>
          </select>
        </div>

        {/* Año */}
        <div>
          <label className="label text-xs">Año académico</label>
          <input
            type="number"
            className="input"
            placeholder="Todos"
            value={anio}
            min={2020} max={2035}
            onChange={e => setAnio(e.target.value)}
          />
        </div>

        {/* Formato */}
        <div>
          <label className="label text-xs">Formato</label>
          <select className="input" value={formato} onChange={e => setFormato(e.target.value)}>
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV (.csv)</option>
          </select>
        </div>
      </div>

      <a href={buildURL()} download className="btn-primary w-full justify-center">
        <Download className="w-4 h-4" />
        Exportar estudiantes
      </a>
    </div>
  );
}
