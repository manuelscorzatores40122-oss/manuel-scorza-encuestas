'use client';

import { useState, useTransition, useRef } from 'react';
import { Upload, CheckCircle2, AlertTriangle, Download, FileSpreadsheet, X } from 'lucide-react';
import { importGeneralAction } from './actions';
import styles from './ImportarGeneral.module.css';

export function ImportarGeneral() {
  const [file,    setFile]   = useState<File | null>(null);
  const [anio,    setAnio]   = useState(new Date().getFullYear());
  const [pending, startT]    = useTransition();
  const [result,  setResult] = useState<any>(null);
  const [error,   setError]  = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function clearFile() {
    setFile(null); setResult(null); setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function submit() {
    if (!file) return;
    setError(null); setResult(null);
    startT(async () => {
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('anio', String(anio));
        const r = await importGeneralAction(fd);
        if (r.ok) setResult(r.result);
        else      setError(r.error);
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
    a.href = url; a.download = `credenciales-${anio}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className={styles.box}>

        {/* Año + plantilla */}
        <div className={styles.topRow}>
          <div className={styles.fieldWrap}>
            <label className={styles.label}>Año académico</label>
            <input
              type="number"
              className={styles.input}
              value={anio}
              onChange={e => setAnio(Number(e.target.value))}
              min={2020} max={2035}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <a href="/api/import/template" download className={styles.btnTemplate}>
              <Download style={{ width: 14, height: 14 }} strokeWidth={1.8} />
              Descargar plantilla
            </a>
          </div>
        </div>

        {/* Drop zone */}
        <div className={styles.dropLabel}>
          <span className={styles.label}>Archivo Excel o CSV</span>
          <label className={styles.dropZone}>
            <FileSpreadsheet className={styles.dropIcon} strokeWidth={1.4} />
            <p className={styles.dropText}>Arrastra o haz clic para seleccionar</p>
            <p className={styles.dropSub}>.xlsx · .xls · .csv</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); setError(null); }}
            />
          </label>

          {file && (
            <div className={styles.fileRow}>
              <FileSpreadsheet className={styles.fileIcon} strokeWidth={1.6} />
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>
              <button onClick={clearFile} className={styles.fileClear}>
                <X style={{ width: 14, height: 14 }} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>

        <button onClick={submit} disabled={!file || pending} className={styles.btnImport}>
          <Upload style={{ width: 14, height: 14 }} strokeWidth={2} />
          {pending ? 'Importando…' : 'Importar alumnos'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.errBanner}>
          <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} strokeWidth={1.8} />
          <span>{error}</span>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className={styles.resultBox}>
          <h3 className={styles.resultTitle}>
            <CheckCircle2 style={{ width: 15, height: 15 }} strokeWidth={2} />
            Importación completada
          </h3>

          <div className={styles.statGrid}>
            <div className={styles.statCell}>
              <p className={styles.statLab}>Procesados</p>
              <p className={`${styles.statVal} ${styles.statValNeutral}`}>{result.total}</p>
            </div>
            <div className={styles.statCell}>
              <p className={styles.statLab}>Creados</p>
              <p className={`${styles.statVal} ${styles.statValGreen}`}>{result.creados}</p>
            </div>
            <div className={styles.statCell}>
              <p className={styles.statLab}>Actualizados</p>
              <p className={`${styles.statVal} ${styles.statValBlue}`}>{result.actualizados}</p>
            </div>
          </div>

          {result.credenciales?.length > 0 && (
            <button onClick={downloadCredenciales} className={styles.btnCredenciales}>
              <Download style={{ width: 14, height: 14 }} strokeWidth={1.8} />
              Descargar credenciales nuevas ({result.credenciales.length})
            </button>
          )}

          {result.errores?.length > 0 && (
            <details className={styles.errDetails}>
              <summary>
                {result.errores.length} fila{result.errores.length !== 1 ? 's' : ''} con error
              </summary>
              <div className={styles.errTableWrap}>
                <table className={styles.errTable}>
                  <thead>
                    <tr>
                      <th className={styles.errTh}>Fila</th>
                      <th className={styles.errTh}>DNI</th>
                      <th className={styles.errTh}>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errores.map((e: any, i: number) => (
                      <tr key={i}>
                        <td className={styles.errTd}>{e.fila}</td>
                        <td className={`${styles.errTd} ${styles.errTdMono}`}>{e.dni}</td>
                        <td className={styles.errTd}>{e.razon}</td>
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
