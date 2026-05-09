'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { createSurveyAction } from '../actions';
import type { Grade } from '@prisma/client';

type QType = 'SINGLE' | 'MULTI' | 'SCALE' | 'TEXT' | 'YES_NO';

type DraftQuestion = {
  type: QType;
  text: string;
  required: boolean;
  options: { label: string; value: string; riskScore: number }[];
  riskScore: number;
};

const TYPE_LABELS: Record<QType, string> = {
  SINGLE: 'Selección única',
  MULTI: 'Selección múltiple',
  SCALE: 'Escala 1-5',
  TEXT: 'Texto abierto',
  YES_NO: 'Sí / No',
};

export function SurveyBuilder({ grades }: { grades: Grade[] }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetGrades, setTargetGrades] = useState<string[]>([]);
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addQuestion(type: QType) {
    let options: DraftQuestion['options'] = [];
    if (type === 'YES_NO') {
      options = [
        { label: 'Sí', value: 'si', riskScore: 0 },
        { label: 'No', value: 'no', riskScore: 0 },
      ];
    } else if (type === 'SINGLE' || type === 'MULTI') {
      options = [
        { label: 'Opción 1', value: 'op1', riskScore: 0 },
        { label: 'Opción 2', value: 'op2', riskScore: 0 },
      ];
    }
    setQuestions((q) => [...q, { type, text: '', required: true, options, riskScore: 0 }]);
  }

  function updateQuestion(idx: number, patch: Partial<DraftQuestion>) {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }
  function removeQuestion(idx: number) {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  }
  function moveQuestion(idx: number, dir: -1 | 1) {
    const ni = idx + dir;
    if (ni < 0 || ni >= questions.length) return;
    const copy = [...questions];
    [copy[idx], copy[ni]] = [copy[ni], copy[idx]];
    setQuestions(copy);
  }

  function toggleGrade(id: string) {
    setTargetGrades((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  }

  function save() {
    setError(null);
    if (!title.trim()) return setError('Falta el título');
    if (questions.length === 0) return setError('Agrega al menos una pregunta');
    if (questions.some((q) => !q.text.trim())) return setError('Hay preguntas sin texto');
    startTransition(async () => {
      const result = await createSurveyAction({
        title, description, targetGrades,
        questions: questions.map((q) => ({
          type: q.type,
          text: q.text,
          required: q.required,
          riskScore: q.riskScore,
          options: ['SINGLE', 'MULTI', 'YES_NO'].includes(q.type) ? q.options : undefined,
        })),
      });
      if (result?.ok) router.push('/psicologo/encuestas');
      else setError(result.error || 'Error al guardar');
    });
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <h1 className="text-2xl font-bold">Nueva encuesta</h1>

      <div className="card space-y-4">
        <div>
          <label className="label">Título</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Bienestar mensual de octubre" />
        </div>
        <div>
          <label className="label">Descripción (opcional)</label>
          <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label">Grados a los que se aplica</label>
          <p className="text-xs text-slate-500 mb-2">Si no seleccionas ninguno, se aplica a todos.</p>
          <div className="flex flex-wrap gap-2">
            {grades.map((g) => {
              const sel = targetGrades.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGrade(g.id)}
                  className={`px-3 py-1.5 rounded-full text-xs border-2 ${sel ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}
                >
                  {g.nivel === 'PRIMARIA' ? 'Pri' : 'Sec'} {g.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Preguntas</h2>
        {questions.length === 0 && (
          <p className="text-sm text-slate-500 mb-3">Aún no agregaste preguntas.</p>
        )}
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={idx} className="border-2 border-slate-100 rounded-xl p-4">
              <div className="flex items-start gap-2 mb-3">
                <div className="flex flex-col">
                  <button onClick={() => moveQuestion(idx, -1)} className="text-slate-400 hover:text-slate-600 text-xs">▲</button>
                  <button onClick={() => moveQuestion(idx, 1)} className="text-slate-400 hover:text-slate-600 text-xs">▼</button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-500">#{idx + 1}</span>
                    <span className="badge bg-brand-100 text-brand-700">{TYPE_LABELS[q.type]}</span>
                  </div>
                  <input
                    className="input"
                    placeholder="Texto de la pregunta"
                    value={q.text}
                    onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                  />
                </div>
                <button onClick={() => removeQuestion(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {(q.type === 'SINGLE' || q.type === 'MULTI' || q.type === 'YES_NO') && (
                <div className="ml-6 space-y-2">
                  <p className="text-xs text-slate-500">Opciones (etiqueta · puntos de riesgo):</p>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex gap-2">
                      <input
                        className="input !py-1.5 text-sm flex-1"
                        value={opt.label}
                        onChange={(e) => {
                          const newOpts = [...q.options];
                          newOpts[oi] = { ...opt, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                          updateQuestion(idx, { options: newOpts });
                        }}
                      />
                      <input
                        type="number"
                        className="input !py-1.5 text-sm w-20"
                        value={opt.riskScore}
                        onChange={(e) => {
                          const newOpts = [...q.options];
                          newOpts[oi] = { ...opt, riskScore: Number(e.target.value) };
                          updateQuestion(idx, { options: newOpts });
                        }}
                      />
                      {q.type !== 'YES_NO' && (
                        <button onClick={() => updateQuestion(idx, { options: q.options.filter((_, i) => i !== oi) })} className="text-red-500 px-2">×</button>
                      )}
                    </div>
                  ))}
                  {q.type !== 'YES_NO' && (
                    <button
                      onClick={() => updateQuestion(idx, { options: [...q.options, { label: 'Nueva opción', value: `op${q.options.length + 1}`, riskScore: 0 }] })}
                      className="text-sm text-brand-600 hover:underline"
                    >+ Agregar opción</button>
                  )}
                </div>
              )}

              <div className="ml-6 mt-3">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(idx, { required: e.target.checked })} />
                  Pregunta obligatoria
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => addQuestion('SINGLE')} className="btn-secondary text-xs">+ Selección única</button>
          <button onClick={() => addQuestion('MULTI')} className="btn-secondary text-xs">+ Selección múltiple</button>
          <button onClick={() => addQuestion('YES_NO')} className="btn-secondary text-xs">+ Sí / No</button>
          <button onClick={() => addQuestion('SCALE')} className="btn-secondary text-xs">+ Escala 1-5</button>
          <button onClick={() => addQuestion('TEXT')} className="btn-secondary text-xs">+ Texto abierto</button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex justify-end gap-2">
        <button onClick={() => router.back()} className="btn-secondary">Cancelar</button>
        <button onClick={save} disabled={pending} className="btn-primary">
          <Save className="w-4 h-4" /> {pending ? 'Guardando...' : 'Guardar encuesta'}
        </button>
      </div>
    </div>
  );
}
