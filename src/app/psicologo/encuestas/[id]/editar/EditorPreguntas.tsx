'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Plus, Save, Trash2, AlertTriangle, Users } from 'lucide-react';
import { updateSurveyQuestionsAction, updateSurveyAction } from '../../actions';
import styles from './editar.module.css';

/* ── Tipos ─────────────────────────────────────────────────── */

type QType   = 'SINGLE' | 'MULTI' | 'SCALE' | 'TEXT' | 'YES_NO';
type Option  = { label: string; value: string; riskScore: number };
type Section = { id: string; name: string };
type Grade   = { id: string; name: string; nivel: string; sections: Section[] };

type DraftQuestion = {
  dbId?:     string;
  id:        string;
  type:      QType;
  text:      string;
  required:  boolean;
  riskScore: number;
  options:   Option[];
};

const TYPE_LABELS: Record<QType, string> = {
  SINGLE: 'Selección única',
  MULTI:  'Selección múltiple',
  SCALE:  'Escala 1–5',
  TEXT:   'Texto abierto',
  YES_NO: 'Sí / No',
};

const QUESTION_TYPES: QType[] = ['SINGLE', 'MULTI', 'YES_NO', 'SCALE', 'TEXT'];

function uid() { return `new_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

function toValue(label: string, idx: number) {
  const c = label.trim().toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return c || `opcion_${idx + 1}`;
}

function defaultOptions(type: QType): Option[] {
  if (type === 'YES_NO') return [
    { label: 'Sí', value: 'si', riskScore: 0 },
    { label: 'No', value: 'no', riskScore: 0 },
  ];
  if (type === 'SINGLE' || type === 'MULTI') return [
    { label: 'Opción 1', value: 'opcion_1', riskScore: 0 },
    { label: 'Opción 2', value: 'opcion_2', riskScore: 0 },
  ];
  return [];
}

function labelTarget(tGrades: string[], tSections: string[], grades: Grade[]): string {
  if (tGrades.length === 0) return 'Toda la institución';
  const map  = new Map(grades.map(g => [g.id, g]));
  const names = tGrades.map(id => map.get(id)?.name ?? '').filter(Boolean).join(', ');
  if (tSections.length === 0) return names;
  const secMap  = new Map(grades.flatMap(g => g.sections.map(s => [s.id, `${g.name}-${s.name}`])));
  const secNames = tSections.map(id => secMap.get(id) ?? '').filter(Boolean).join(', ');
  return `${names} / ${secNames}`;
}

/* ── Componente principal ──────────────────────────────────── */

export function EditorPreguntas({
  surveyId,
  responsesCount,
  initialTargetGrades,
  initialTargetSections,
  grades,
  initialQuestions,
}: {
  surveyId:              string;
  responsesCount:        number;
  initialTargetGrades:   string[];
  initialTargetSections: string[];
  grades:                Grade[];
  initialQuestions:      DraftQuestion[];
}) {
  const router                       = useRouter();
  const [pending, startTransition]   = useTransition();
  const [questions, setQuestions]    = useState<DraftQuestion[]>(initialQuestions);
  const [targetGrades, setTargetGrades]     = useState<string[]>(initialTargetGrades);
  const [targetSections, setTargetSections] = useState<string[]>(initialTargetSections);
  const [error,  setError]           = useState<string | null>(null);
  const [saved,  setSaved]           = useState(false);

  const primaria   = grades.filter(g => g.nivel === 'PRIMARIA');
  const secundaria = grades.filter(g => g.nivel === 'SECUNDARIA');
  const allSchool  = targetGrades.length === 0;

  /* ── Destinatarios ── */
  function toggleGrade(gradeId: string) {
    if (targetGrades.includes(gradeId)) {
      setTargetGrades(prev => prev.filter(id => id !== gradeId));
      const secIds = grades.find(g => g.id === gradeId)?.sections.map(s => s.id) ?? [];
      setTargetSections(prev => prev.filter(id => !secIds.includes(id)));
    } else {
      setTargetGrades(prev => [...prev, gradeId]);
    }
  }

  function toggleSection(sectionId: string, gradeId: string) {
    if (targetSections.includes(sectionId)) {
      setTargetSections(prev => prev.filter(id => id !== sectionId));
    } else {
      setTargetSections(prev => [...prev, sectionId]);
      if (!targetGrades.includes(gradeId)) setTargetGrades(prev => [...prev, gradeId]);
    }
  }

  /* ── Preguntas ── */
  function addQuestion(type: QType) {
    setQuestions(qs => [...qs, { id: uid(), type, text: '', required: true, riskScore: 0, options: defaultOptions(type) }]);
  }

  function updateQuestion(id: string, patch: Partial<DraftQuestion>) {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, ...patch } : q));
  }

  function removeQuestion(id: string) { setQuestions(qs => qs.filter(q => q.id !== id)); }

  function moveQuestion(id: string, dir: -1 | 1) {
    setQuestions(qs => {
      const i = qs.findIndex(q => q.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= qs.length) return qs;
      const copy = [...qs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  function updateOption(qId: string, idx: number, patch: Partial<Option>) {
    setQuestions(qs => qs.map(q => {
      if (q.id !== qId) return q;
      const opts = q.options.map((o, i) => {
        if (i !== idx) return o;
        const next = { ...o, ...patch };
        if (patch.label !== undefined) next.value = toValue(patch.label, idx);
        return next;
      });
      return { ...q, options: opts };
    }));
  }

  function addOption(qId: string) {
    setQuestions(qs => qs.map(q => {
      if (q.id !== qId) return q;
      const n = q.options.length;
      return { ...q, options: [...q.options, { label: `Opción ${n + 1}`, value: `opcion_${n + 1}`, riskScore: 0 }] };
    }));
  }

  function removeOption(qId: string, idx: number) {
    setQuestions(qs => qs.map(q => {
      if (q.id !== qId) return q;
      return { ...q, options: q.options.filter((_, i) => i !== idx) };
    }));
  }

  /* ── Guardar todo ── */
  function save() {
    setError(null);
    if (questions.length === 0) { setError('Agrega al menos una pregunta'); return; }
    for (const [i, q] of questions.entries()) {
      if (!q.text.trim()) { setError(`La pregunta ${i + 1} necesita texto`); return; }
      const needsOpts = ['SINGLE', 'MULTI', 'YES_NO'].includes(q.type);
      if (needsOpts && q.options.length < 2) { setError(`La pregunta ${i + 1} necesita al menos 2 opciones`); return; }
    }

    startTransition(async () => {
      // Guardar destinatarios y preguntas en paralelo
      const [resTargets, resQuestions] = await Promise.all([
        updateSurveyAction(surveyId, '', '', targetGrades, targetSections),
        updateSurveyQuestionsAction(surveyId, questions.map(q => ({
          dbId:      q.dbId,
          type:      q.type,
          text:      q.text,
          required:  q.required,
          riskScore: q.riskScore,
          options:   ['SINGLE', 'MULTI', 'YES_NO'].includes(q.type) ? q.options : undefined,
        }))),
      ]);

      if (!resTargets.ok)  { setError('Error al guardar destinatarios'); return; }
      if (!resQuestions.ok) { setError(resQuestions.error); return; }

      setSaved(true);
      setTimeout(() => router.push('/psicologo/encuestas'), 900);
    });
  }

  /* ── UI ───────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* Aviso si hay respuestas */}
      {responsesCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Esta encuesta tiene <strong>{responsesCount}</strong> {responsesCount === 1 ? 'respuesta enviada' : 'respuestas enviadas'}.
            Puedes editar el texto y las opciones. Las preguntas con respuestas asociadas no se eliminarán del sistema.
          </span>
        </div>
      )}

      {/* ── Destinatarios ── */}
      <section className="card space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-600" />
          <h2 className="text-base font-semibold text-slate-900">Destinatarios</h2>
          <span className="ml-auto text-xs text-slate-400 font-medium">
            {labelTarget(targetGrades, targetSections, grades)}
          </span>
        </div>

        {/* Toggle toda la institución */}
        <label className={styles.checkToda}>
          <input
            type="checkbox"
            checked={allSchool}
            onChange={() => { setTargetGrades([]); setTargetSections([]); }}
          />
          <span>Toda la institución (sin filtros)</span>
        </label>

        {/* Grid de grados */}
        <div className={`${styles.gradePicker} ${allSchool ? styles.gradePickerMuted : ''}`}>

          <div className={styles.levelGroup}>
            <span className={styles.levelLabel}>Primaria</span>
            <div className={styles.gradeRow}>
              {primaria.map(g => (
                <div key={g.id} className={styles.gradeCell}>
                  <button
                    type="button"
                    className={`${styles.gradeChip} ${targetGrades.includes(g.id) ? styles.gradeChipOn : ''}`}
                    onClick={() => allSchool ? setTargetGrades([g.id]) : toggleGrade(g.id)}
                    disabled={pending}
                  >
                    {g.name}
                  </button>
                  {targetGrades.includes(g.id) && (
                    <div className={styles.secRow}>
                      {g.sections.map(sec => (
                        <button
                          key={sec.id}
                          type="button"
                          className={`${styles.secChip} ${targetSections.includes(sec.id) ? styles.secChipOn : ''}`}
                          onClick={() => toggleSection(sec.id, g.id)}
                          disabled={pending}
                        >
                          {sec.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.levelGroup}>
            <span className={styles.levelLabel}>Secundaria</span>
            <div className={styles.gradeRow}>
              {secundaria.map(g => (
                <div key={g.id} className={styles.gradeCell}>
                  <button
                    type="button"
                    className={`${styles.gradeChip} ${targetGrades.includes(g.id) ? styles.gradeChipOn : ''}`}
                    onClick={() => allSchool ? setTargetGrades([g.id]) : toggleGrade(g.id)}
                    disabled={pending}
                  >
                    {g.name}
                  </button>
                  {targetGrades.includes(g.id) && (
                    <div className={styles.secRow}>
                      {g.sections.map(sec => (
                        <button
                          key={sec.id}
                          type="button"
                          className={`${styles.secChip} ${targetSections.includes(sec.id) ? styles.secChipOn : ''}`}
                          onClick={() => toggleSection(sec.id, g.id)}
                          disabled={pending}
                        >
                          {sec.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Preguntas ── */}
      <section className="card space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Preguntas
            <span className="ml-2 text-sm font-normal text-slate-400">{questions.length} en total</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {QUESTION_TYPES.map(type => (
              <button
                key={type}
                type="button"
                className="btn-secondary !px-3 !py-2 text-xs"
                onClick={() => addQuestion(type)}
                disabled={pending}
              >
                <Plus className="h-3.5 w-3.5" />
                {TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Agrega preguntas usando los botones de arriba.
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                total={questions.length}
                pending={pending}
                onUpdate={patch => updateQuestion(q.id, patch)}
                onRemove={() => removeQuestion(q.id)}
                onMove={dir => moveQuestion(q.id, dir)}
                onAddOption={() => addOption(q.id)}
                onUpdateOption={(i, patch) => updateOption(q.id, i, patch)}
                onRemoveOption={i => removeOption(q.id, i)}
              />
            ))}
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {saved && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 font-medium">
          ✓ Cambios guardados correctamente. Redirigiendo…
        </div>
      )}

      <footer className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()} disabled={pending}>
          Cancelar
        </button>
        <button type="button" className="btn-primary" onClick={save} disabled={pending || saved}>
          <Save className="h-4 w-4" />
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </footer>

    </div>
  );
}

/* ── Tarjeta de pregunta ───────────────────────────────────── */

function QuestionCard({
  question, index, total, pending,
  onUpdate, onRemove, onMove,
  onAddOption, onUpdateOption, onRemoveOption,
}: {
  question:       DraftQuestion;
  index:          number;
  total:          number;
  pending:        boolean;
  onUpdate:       (patch: Partial<DraftQuestion>) => void;
  onRemove:       () => void;
  onMove:         (dir: -1 | 1) => void;
  onAddOption:    () => void;
  onUpdateOption: (idx: number, patch: Partial<Option>) => void;
  onRemoveOption: (idx: number) => void;
}) {
  const hasOptions = ['SINGLE', 'MULTI', 'YES_NO'].includes(question.type);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Pregunta {index + 1}
            {!question.dbId && <span className="ml-2 font-normal normal-case tracking-normal text-brand-600">· nueva</span>}
          </p>
          <p className="text-sm font-medium text-brand-700">{TYPE_LABELS[question.type]}</p>
        </div>
        <div className="flex gap-1">
          <button type="button" className="btn-secondary !px-2 !py-2" onClick={() => onMove(-1)} disabled={pending || index === 0}>
            <ChevronUp className="h-4 w-4" />
          </button>
          <button type="button" className="btn-secondary !px-2 !py-2" onClick={() => onMove(1)} disabled={pending || index === total - 1}>
            <ChevronDown className="h-4 w-4" />
          </button>
          <button type="button" className="btn-danger !px-2 !py-2" onClick={onRemove} disabled={pending}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`q-${question.id}`}>Texto de la pregunta</label>
        <input
          id={`q-${question.id}`}
          className="input"
          placeholder="Escribe la pregunta que verá el estudiante"
          value={question.text}
          onChange={e => onUpdate({ text: e.target.value })}
          disabled={pending}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_180px] md:items-end">
        <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
          <input type="checkbox" checked={question.required} onChange={e => onUpdate({ required: e.target.checked })} disabled={pending} />
          Obligatoria
        </label>
        <div>
          <label className="label" htmlFor={`rs-${question.id}`}>Riesgo base</label>
          <input id={`rs-${question.id}`} className="input" type="number" min={0} max={100}
            value={question.riskScore} onChange={e => onUpdate({ riskScore: Number(e.target.value) || 0 })} disabled={pending} />
        </div>
      </div>

      {hasOptions && (
        <div className="space-y-3 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800">Opciones</h3>
            {question.type !== 'YES_NO' && (
              <button type="button" className="btn-secondary !px-3 !py-2 text-xs" onClick={onAddOption} disabled={pending}>
                <Plus className="h-3.5 w-3.5" /> Agregar opción
              </button>
            )}
          </div>
          {question.options.map((opt, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-[1fr_130px_auto] md:items-center">
              <input className="input" placeholder={`Opción ${i + 1}`} value={opt.label}
                onChange={e => onUpdateOption(i, { label: e.target.value })} disabled={pending} />
              <input className="input" type="number" min={0} max={100} value={opt.riskScore}
                onChange={e => onUpdateOption(i, { riskScore: Number(e.target.value) || 0 })}
                disabled={pending} aria-label="Puntaje de riesgo" />
              <button type="button" className="btn-secondary !px-3" onClick={() => onRemoveOption(i)}
                disabled={pending || question.type === 'YES_NO' || question.options.length <= 2}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
