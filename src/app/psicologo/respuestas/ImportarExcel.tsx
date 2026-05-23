'use client';

import { useRef, useState, useTransition } from 'react';
import { Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { importResponsesExcelAction } from './actions';
import styles from './page.module.css';

type SurveyOption = { id: string; title: string };

export function ImportarExcel({ surveys }: { surveys: SurveyOption[] }) {
  const inputRef               = useRef<HTMLInputElement>(null);
  const [surveyId, setSurveyId] = useState(surveys[0]?.id || '');
  const [file,     setFile]     = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [result,  setResult]    = useState<any>(null);
  const [error,   setError]     = useState<string | null>(null);

  function pickFile() { inputRef.current?.click(); }

  function submit() {
    if (!file || !surveyId) return;
    setError(null);
    setResult(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('surveyId', surveyId);
      formData.append('file', file);
      const res = await importResponsesExcelAction(formData);
      if (res.ok) { setResult(res.result); setFile(null); }
      else        { setError(res.error); }
    });
  }

  return (
    <div className={styles.tool}>
      <div className={styles.toolHead}>
        <Upload className={styles.toolHeadIcon} />
        <h3 className={styles.toolTitle}>Importar desde Excel</h3>
      </div>
      <p className={styles.toolDesc}>
        Una fila por estudiante. La primera columna debe ser DNI; las preguntas pueden ir como P1, P2, P3…
      </p>

      {/* Encuesta destino */}
      <div className={`${styles.toolGrid} ${styles.toolGridFull}`}>
        <div className={styles.tf}>
          <label className={styles.tfLabel}>Encuesta destino</label>
          <select
            value={surveyId}
            onChange={(e) => setSurveyId(e.target.value)}
            className={styles.fieldSel}
          >
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selector de archivo */}
      <div className={styles.fileRow}>
        <button type="button" className={styles.fileBtn} onClick={pickFile}>
          <Upload className={styles.fileBtnIcon} />
          Seleccionar archivo
        </button>
        <span className={styles.fileName}>
          {file?.name || 'Sin archivo seleccionado'}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <button
        type="button"
        className={styles.btnSolid}
        disabled={!file || !surveyId || pending}
        onClick={submit}
      >
        <Upload className={styles.btnSolidIcon} />
        {pending ? 'Importando…' : 'Importar respuestas'}
      </button>

      {/* Feedback */}
      {error && (
        <div className={`${styles.importFeedback} ${styles.importError}`}>
          <AlertTriangle className={styles.importErrIcon} />
          {error}
        </div>
      )}

      {result && (
        <div className={`${styles.importFeedback} ${styles.importResult}`}>
          <div className={styles.importResultTitle}>
            <CheckCircle2 className={styles.importResultIcon} />
            Importación completada
          </div>
          <div className={styles.importMetrics}>
            <Metric label="Filas"      value={result.total} />
            <Metric label="Importados" value={result.importados} />
            <Metric label="Omitidos"   value={result.omitidos} />
            <Metric label="Errores"    value={result.errores?.length || 0} />
          </div>
          {result.errores?.length > 0 && (
            <details className={styles.importErrorList}>
              <summary>Ver {result.errores.length} error(es)</summary>
              {result.errores.map((item: any, i: number) => (
                <span key={`${item.fila}-${i}`}>Fila {item.fila}: {item.razon}</span>
              ))}
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className={styles.importMetricLabel}>{label}</div>
      <div className={styles.importMetricValue}>{value}</div>
    </div>
  );
}
