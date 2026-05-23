'use client';

import { useState, useTransition, useRef } from 'react';
import { Upload, CheckCircle2, AlertTriangle, Download, FileSpreadsheet, X } from 'lucide-react';
import { importGeneralAction } from './actions';

export function ImportarGeneral() {
  const [file,    setFile]    = useState<File | null>(null);
  const [anio,    setAnio]    = useState(new Date().getFullYear());
  const [pending, startT]     = useTransition();
  const [result,  setResult]  = useState<any>(null);
  const [error,   setError]   = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function clearFile() {
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function submit() {
    if (!file) return;
    setError(null);
    setResult(null);
    startT(async () => {
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('anio', String(anio));
        const r = await importGeneralAction(fd);
        if (r.ok) setResult(r.result);
        else setError(r.error);
      } catch (e: any) {
        setError(e.message || 'Error al importar');
      }
    });
  }

  function downloadCredenciales() {
    if (!result?.credenciales?.length) return;
    const csv = ['DNI,Nombre,Clave inicial',
      ...result.credenciales.map((c: any) => `${c.dni},"${c.nombre}",${c.clave}`)
    ].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `credenciales-${anio}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4">

        {/* Año académico */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Año académico</label>
            <input
              type="number"
              className="input"
              value={anio}
              onChange={e => setAnio(Number(e.target.value))}
              min={2020}
              max={2035}
            />
          </div>
          <div className="flex items-end">
            <a
              href="/api/import/template"
              download
              className="btn-secondary w-full justify-center text-sm"
            >
              <Download className="w-4 h-4" />
              Descargar plantilla
            </a>
          </div>
        </div>

        {/* Zona de carga */}
        <div>
          <label className="label">Archivo Excel o CSV</label>
          <label className="block border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer">
            <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-500 mb-2">
              Arrastra o haz clic para seleccionar
            </p>
            <p className="text-xs text-slate-400">.xlsx · .xls · .csv</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); setError(null); }}
            />
          </label>

          {file && (
            <div className="mt-2 flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span className="flex-1 truncate text-slate-700">{file.name}</span>
              <span className="text-slate-400 text-xs">{(file.size / 1024).toFixed(1)} KB</span>
              <button onClick={clearFile} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={submit}
          disabled={!file || pending}
          className="btn-primary w-full"
        >
          <Upload className="w-4 h-4" />
          {pending ? 'Importando…' : 'Importar alumnos'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="card bg-emerald-50 border-emerald-200 space-y-3">
          <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Importación completada
          </h3>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-600">Procesados</p>
              <p className="text-2xl font-bold text-slate-900">{result.total}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Creados</p>
              <p className="text-2xl font-bold text-emerald-700">{result.creados}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Actualizados</p>
              <p className="text-2xl font-bold text-indigo-700">{result.actualizados}</p>
            </div>
          </div>

          {result.credenciales?.length > 0 && (
            <button onClick={downloadCredenciales} className="btn-secondary w-full">
              <Download className="w-4 h-4" />
              Descargar credenciales nuevas ({result.credenciales.length})
            </button>
          )}

          {result.errores?.length > 0 && (
            <details className="mt-1">
              <summary className="text-sm cursor-pointer text-red-700 font-medium">
                {result.errores.length} fila{result.errores.length !== 1 ? 's' : ''} con error
              </summary>
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-red-100 bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-red-50 text-red-700 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2">Fila</th>
                      <th className="text-left px-3 py-2">DNI</th>
                      <th className="text-left px-3 py-2">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errores.map((e: any, i: number) => (
                      <tr key={i} className="border-t border-red-50">
                        <td className="px-3 py-1.5 text-slate-500">{e.fila}</td>
                        <td className="px-3 py-1.5 font-mono">{e.dni}</td>
                        <td className="px-3 py-1.5 text-slate-600">{e.razon}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
