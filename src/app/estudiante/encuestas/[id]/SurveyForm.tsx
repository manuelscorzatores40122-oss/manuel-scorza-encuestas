'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CheckCircle2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitSurveyAction } from './actions';

type Question = {
  id: string;
  type: string;
  text: string;
  options: any;
  required: boolean;
  order: number;
};

type Survey = {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
};

export function SurveyForm({ survey }: { survey: Survey }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = survey.questions.length;
  const current = survey.questions[step];
  const progress = ((step + 1) / total) * 100;

  function setAnswer(qid: string, value: any) {
    setAnswers((p) => ({ ...p, [qid]: value }));
  }

  function canAdvance() {
    if (!current) return false;
    if (!current.required) return true;
    const v = answers[current.id];
    if (current.type === 'MULTI') return Array.isArray(v) && v.length > 0;
    return v !== undefined && v !== null && String(v).trim() !== '';
  }

  function next() {
    if (step < total - 1) setStep(step + 1);
  }
  function prev() {
    if (step > 0) setStep(step - 1);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const payload = survey.questions.map((q) => ({
        questionId: q.id,
        value: serializeAnswer(answers[q.id], q.type),
      }));
      const result = await submitSurveyAction({ surveyId: survey.id, answers: payload });
      if (result.ok) {
        setSubmitted(true);
        setTimeout(() => router.push('/estudiante'), 2500);
      } else {
        setError(result.error);
      }
    });
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto card text-center animate-slide-up">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">¡Gracias por responder!</h2>
        <p className="text-slate-600 mt-2">
          Tu respuesta fue enviada y es totalmente privada.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <header className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">{survey.title}</h1>
        {survey.description && <p className="text-slate-600 text-sm mt-1">{survey.description}</p>}
      </header>

      <div className="mb-4 flex items-center gap-3 text-xs text-slate-500">
        <span>Pregunta {step + 1} de {total}</span>
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-warm-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="card animate-slide-up" key={current.id}>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          {current.text}
          {current.required && <span className="text-warm-600 ml-1">*</span>}
        </h2>
        {!current.required && <p className="text-xs text-slate-500 mb-4">Opcional</p>}

        <div className="mt-5">
          <QuestionInput
            question={current}
            value={answers[current.id]}
            onChange={(v) => setAnswer(current.id, v)}
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button onClick={prev} className="btn-secondary" disabled={step === 0}>
          <ChevronLeft className="w-4 h-4" /> Anterior
        </button>
        {step < total - 1 ? (
          <button onClick={next} className="btn-warm" disabled={!canAdvance()}>
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={submit} className="btn-warm" disabled={!canAdvance() || pending}>
            <Send className="w-4 h-4" /> {pending ? 'Enviando...' : 'Enviar respuestas'}
          </button>
        )}
      </div>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: { question: Question; value: any; onChange: (v: any) => void }) {
  const opts: { label: string; value: string }[] = (question.options as any) || [];

  if (question.type === 'TEXT') {
    return (
      <textarea
        className="input min-h-[120px] resize-none"
        placeholder="Escribe aquí lo que sientes..."
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        maxLength={1000}
      />
    );
  }

  if (question.type === 'YES_NO' || question.type === 'SINGLE') {
    return (
      <div className="grid gap-2">
        {opts.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'w-full text-left px-4 py-3 rounded-xl border-2 transition-all',
              value === o.value
                ? 'border-warm-500 bg-warm-50 text-warm-900'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                  value === o.value ? 'border-warm-500 bg-warm-500' : 'border-slate-300'
                )}
              >
                {value === o.value && <span className="w-2 h-2 bg-white rounded-full" />}
              </span>
              <span className="font-medium">{o.label}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (question.type === 'MULTI') {
    const arr: string[] = Array.isArray(value) ? value : [];
    const toggle = (v: string) => {
      if (arr.includes(v)) onChange(arr.filter((x) => x !== v));
      else onChange([...arr, v]);
    };
    return (
      <div className="grid gap-2">
        {opts.map((o) => {
          const selected = arr.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl border-2 transition-all',
                selected ? 'border-warm-500 bg-warm-50' : 'border-slate-200 hover:border-slate-300 bg-white'
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center',
                  selected ? 'border-warm-500 bg-warm-500' : 'border-slate-300'
                )}>
                  {selected && <span className="text-white text-xs">✓</span>}
                </span>
                <span className="font-medium">{o.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'SCALE') {
    return (
      <div className="flex gap-2 justify-between">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(String(n))}
            className={cn(
              'flex-1 aspect-square rounded-xl border-2 font-bold text-xl transition-all',
              value === String(n)
                ? 'border-warm-500 bg-warm-500 text-white'
                : 'border-slate-200 hover:border-warm-300 bg-white'
            )}
          >
            {n}
          </button>
        ))}
      </div>
    );
  }

  return null;
}

function serializeAnswer(value: any, type: string): string {
  if (value === undefined || value === null) return '';
  if (type === 'MULTI' && Array.isArray(value)) return JSON.stringify(value);
  return String(value);
}
