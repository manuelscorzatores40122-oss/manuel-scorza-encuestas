'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, CheckCircle2, Upload } from 'lucide-react';
import { importResponsesExcelAction } from './actions';

type SurveyOption = {
  id: string;
  title: string;
};

export function ImportarExcel({ surveys }: { surveys: SurveyOption[] }) {
  const [surveyId, setSurveyId] = useState(surveys[0]?.id || '');
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!file || !surveyId) return;
    setError(null);
    setResult(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('surveyId', surveyId);
      formData.append('file', file);

      const response = await importResponsesExcelAction(formData);

      if (response.ok) {
        setResult(response.result);
        setFile(null);
      } else {
        setError(response.error);
      }
    });
  }

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Importar respuestas desde Excel</h2>
          <p className="text-sm text-slate-500">
            Usa una fila por estudiante. La primera columna debe ser DNI y las preguntas pueden estar como P1, P2, P3...
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <div>
          <label className="label text-xs">Encuesta</label>
          <select className="input" value={surveyId} onChange={(event) => setSurveyId(event.target.value)}>
            {surveys.map((survey) => (
              <option key={survey.id} value={survey.id}>
                {survey.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label text-xs">Archivo Excel</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="input"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </div>

        <button type="button" className="btn-primary" disabled={!file || !surveyId || pending} onClick={submit}>
          <Upload className="w-4 h-4" />
          {pending ? 'Importando...' : 'Importar'}
        </button>
      </div>

      <div className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600">
        Encabezados aceptados: <strong>DNI</strong>, <strong>P1</strong>, <strong>P2</strong>, etc. También puedes usar el texto exacto de cada pregunta.
        En selección múltiple separa respuestas con coma, punto y coma o barra vertical.
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            Importación completada
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            <Metric label="Filas" value={result.total} />
            <Metric label="Importados" value={result.importados} />
            <Metric label="Omitidos" value={result.omitidos} />
            <Metric label="Errores" value={result.errores?.length || 0} />
          </div>

          {result.errores?.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-red-700">
                Ver errores
              </summary>
              <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto text-xs text-red-700">
                {result.errores.map((item: any, index: number) => (
                  <li key={`${item.fila}-${index}`}>
                    Fila {item.fila}: {item.razon}
                  </li>
                ))}
              </ul>
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
      <p className="text-xs opacity-75">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
