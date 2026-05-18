'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Save } from 'lucide-react';
import { createSurveyAction } from '../../actions';

/* ================= TYPES ================= */

type Option = {
  label: string;
  value: string;
  riskScore: number;
};

type Question = {
  type: 'SINGLE' | 'MULTI' | 'SCALE' | 'TEXT' | 'YES_NO';
  text: string;
  required: boolean;
  riskScore: number;
  options: Option[];
};

type Survey = {
  title: string;
  description: string;
  targetGrades: string[];
  questions: Question[];
};

const QUESTION_TYPES = ['SINGLE', 'MULTI', 'SCALE', 'TEXT', 'YES_NO'] as const;

function toQuestionType(value: string): Question['type'] {
  return QUESTION_TYPES.includes(value as Question['type'])
    ? (value as Question['type'])
    : 'TEXT';
}

/* ================= CSV PARSER ROBUSTO ================= */

function parseCSV(text: string) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const row: Record<string, string> = {};

    headers.forEach((h, i) => {
      row[h] = values[i]?.trim() || '';
    });

    return row;
  });
}

/* ================= BUILD SURVEY ================= */

function buildSurvey(rows: any[]): Survey {
  const map = new Map<string, Question>();

  const title = rows[0]?.survey_title || 'Encuesta importada';
  const description = rows[0]?.survey_description || '';

  for (const r of rows) {
    const qKey = r.question_text;

    if (!map.has(qKey)) {
      map.set(qKey, {
        type: toQuestionType(r.question_type),
        text: qKey,
        required: r.required === 'true',
        riskScore: Number(r.question_risk_score || 0),
        options: [],
      });
    }

    const q = map.get(qKey)!;

    // opciones (si existen)
    if (r.option_label) {
      q.options.push({
        label: r.option_label,
        value:
          r.option_value ||
          r.option_label.toLowerCase().replace(/\s+/g, '_'),
        riskScore: Number(r.risk_score || 0),
      });
    }
  }

  return {
    title,
    description,
    targetGrades: rows[0]?.grade_scope === 'TODOS' ? [] : [],
    questions: Array.from(map.values()),
  };
}

/* ================= PAGE ================= */

export default function ImportCSVPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [preview, setPreview] = useState<Survey | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* FILE HANDLER */
  const handleFile = async (file: File) => {
    setError(null);

    const text = await file.text();

    try {
      const rows = parseCSV(text);
      const survey = buildSurvey(rows);
      setPreview(survey);
    } catch (err) {
      setError('Error al leer CSV');
    }
  };

  /* SAVE */
  const save = () => {
    if (!preview) return;

    startTransition(async () => {
      const result = await createSurveyAction({
        title: preview.title,
        description: preview.description,
        targetGrades: preview.targetGrades,
        targetSections: [],
        questions: preview.questions,
      });

      if (result?.ok) {
        router.push('/psicologo/encuestas');
      } else {
        setError(result?.error || 'Error al importar');
      }
    });
  };

  return (
    <div className="max-w-3xl space-y-6">

      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Upload size={20} /> Importar encuesta CSV
      </h1>
      {/* UPLOAD */}
      <div className="card space-y-3">
        <label className="font-medium">Subir archivo CSV</label>

        <input
          type="file"
          accept=".csv"
          className="input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        <p className="text-xs text-slate-500">
          Columnas: survey_title, question_type, question_text, option_label, risk_score
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* PREVIEW */}
      {preview && (
        <div className="card space-y-3">
          <h2 className="font-semibold">Vista previa</h2>

          <p><b>Título:</b> {preview.title}</p>
          <p className="text-sm text-slate-500">{preview.description}</p>

          <p className="text-sm">
            Preguntas: {preview.questions.length}
          </p>

          <div className="space-y-2">
            {preview.questions.map((q, i) => (
              <div key={i} className="border rounded-lg p-3">
                <p className="font-medium">{q.text}</p>
                <p className="text-xs text-slate-500">{q.type}</p>

                {q.options.length > 0 && (
                  <ul className="text-xs mt-1 list-disc ml-4">
                    {q.options.map((o, j) => (
                      <li key={j}>
                        {o.label} — riesgo {o.riskScore}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={() => router.back()}>
          Cancelar
        </button>

        <button
          className="btn-primary flex items-center gap-2"
          onClick={save}
          disabled={!preview || pending}
        >
          <Save size={16} />
          {pending ? 'Guardando...' : 'Importar encuesta'}
        </button>
      </div>
    </div>
  );
}
