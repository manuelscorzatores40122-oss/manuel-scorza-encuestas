'use client';

import { useState, useTransition } from 'react';
import { Upload, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { importSiagieAction } from './actions';

export function ImportSiagie() {
  const [file, setFile] = useState<File | null>(null);
  const [nivel, setNivel] = useState<'PRIMARIA' | 'SECUNDARIA'>('PRIMARIA');
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!file) return;
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('nivel', nivel);
        fd.append('anio', String(anio));
        const r = await importSiagieAction(fd);
        if (r.ok) setResult(r.result);
        else setError(r.error);
      } catch (e: any) {
        setError(e.message || 'Error al importar');
      }
    });
  }

  function downloadCredenciales() {
    if (!result?.credenciales?.length) return;
    const csv = ['DNI,Nombre,Clave inicial', ...result.credenciales.map((c: any) =>
      `${c.dni},"${c.nombre}",${c.clave}`
    )].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credenciales-${nivel.toLowerCase()}-${anio}.csv`;
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nivel</label>
            <select className="input" value={nivel} onChange={(e) => setNivel(e.target.value as any)}>
              <option value="PRIMARIA">Primaria</option>
              <option value="SECUNDARIA">Secundaria</option>
            </select>
          </div>
          <div>
            <label className="label">Año académico</label>
            <input type="number" className="input" value={anio} onChange={(e) => setAnio(Number(e.target.value))} />
          </div>
        </div>

        <div>
          <label className="label">Archivo Excel</label>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-brand-400 transition-colors">
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-sm"
            />
            {file && <p className="text-xs text-slate-500 mt-2">{file.name} · {(file.size / 1024).toFixed(1)} KB</p>}
          </div>
        </div>

        <button onClick={submit} disabled={!file || pending} className="btn-primary w-full">
          <Upload className="w-4 h-4" /> {pending ? 'Importando...' : 'Importar'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <AlertTriangle className="w-5 h-5 inline mr-2" />
          {error}
        </div>
      )}

      {result && (
        <div className="card bg-emerald-50 border-emerald-200">
          <h3 className="font-semibold text-emerald-900 flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5" /> Importación completada
          </h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><p className="text-xs text-slate-600">Procesados</p><p className="text-2xl font-bold">{result.total}</p></div>
            <div><p className="text-xs text-slate-600">Creados</p><p className="text-2xl font-bold text-emerald-700">{result.creados}</p></div>
            <div><p className="text-xs text-slate-600">Actualizados</p><p className="text-2xl font-bold text-brand-700">{result.actualizados}</p></div>
          </div>

          {result.credenciales?.length > 0 && (
            <button onClick={downloadCredenciales} className="btn-secondary mt-4 w-full">
              <Download className="w-4 h-4" /> Descargar credenciales nuevas ({result.credenciales.length})
            </button>
          )}

          {result.errores?.length > 0 && (
            <details className="mt-4">
              <summary className="text-sm cursor-pointer text-red-700">{result.errores.length} errores</summary>
              <ul className="mt-2 text-xs space-y-1 max-h-40 overflow-y-auto">
                {result.errores.map((e: any, i: number) => (
                  <li key={i}>Fila {e.fila}: {e.razon}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
