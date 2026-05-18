'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { createSurveyAction } from '../actions';
import type { Grade, Section } from '@prisma/client';

type QType = 'SINGLE' | 'MULTI' | 'SCALE' | 'TEXT' | 'YES_NO';
type GradeWithSections = Grade & { sections: Section[] };

type Option = {
  label: string;
  value: string;
  riskScore: number;
};

type DraftQuestion = {
  id: string;
  type: QType;
  text: string;
  required: boolean;
  riskScore: number;
  options: Option[];
};

type TargetRow = {
  id: string;
  gradeId: string;
  sectionId: string;
};

const ALL_SECTIONS = '__ALL__';

const TYPE_LABELS: Record<QType, string> = {
  SINGLE: 'Selección única',
  MULTI: 'Selección múltiple',
  SCALE: 'Escala 1-5',
  TEXT: 'Texto abierto',
  YES_NO: 'Sí / No',
};

const QUESTION_TYPES: QType[] = ['SINGLE', 'MULTI', 'YES_NO', 'SCALE', 'TEXT'];

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toValue(label: string, index: number) {
  const clean = label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return clean || `opcion_${index + 1}`;
}

function defaultOptions(type: QType): Option[] {
  if (type === 'YES_NO') {
    return [
      { label: 'Sí', value: 'si', riskScore: 0 },
      { label: 'No', value: 'no', riskScore: 0 },
    ];
  }

  if (type === 'SINGLE' || type === 'MULTI') {
    return [
      { label: 'Opción 1', value: 'opcion_1', riskScore: 0 },
      { label: 'Opción 2', value: 'opcion_2', riskScore: 0 },
    ];
  }

  return [];
}

export function SurveyBuilder({ grades }: { grades: GradeWithSections[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targets, setTargets] = useState<TargetRow[]>([]);
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const gradesById = useMemo(
    () => new Map(grades.map((grade) => [grade.id, grade])),
    [grades]
  );

  const availableGrades = grades.filter(
    (grade) => !targets.some((target) => target.gradeId === grade.id)
  );

  function addTarget(gradeId: string) {
    if (!gradeId) return;
    setTargets((current) => [
      ...current,
      { id: newId('target'), gradeId, sectionId: ALL_SECTIONS },
    ]);
  }

  function updateTarget(id: string, patch: Partial<TargetRow>) {
    setTargets((current) =>
      current.map((target) =>
        target.id === id ? { ...target, ...patch } : target
      )
    );
  }

  function removeTarget(id: string) {
    setTargets((current) => current.filter((target) => target.id !== id));
  }

  function addQuestion(type: QType) {
    setQuestions((current) => [
      ...current,
      {
        id: newId('question'),
        type,
        text: '',
        required: true,
        riskScore: type === 'TEXT' ? 0 : 0,
        options: defaultOptions(type),
      },
    ]);
  }

  function updateQuestion(id: string, patch: Partial<DraftQuestion>) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id ? { ...question, ...patch } : question
      )
    );
  }

  function removeQuestion(id: string) {
    setQuestions((current) => current.filter((question) => question.id !== id));
  }

  function moveQuestion(id: string, direction: -1 | 1) {
    setQuestions((current) => {
      const index = current.findIndex((question) => question.id === id);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      return copy;
    });
  }

  function updateOption(questionId: string, optionIndex: number, patch: Partial<Option>) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;

        const options = question.options.map((option, index) => {
          if (index !== optionIndex) return option;
          const next = { ...option, ...patch };

          if (patch.label !== undefined) {
            next.value = toValue(patch.label, optionIndex);
          }

          return next;
        });

        return { ...question, options };
      })
    );
  }

  function addOption(questionId: string) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;

        const nextIndex = question.options.length;
        return {
          ...question,
          options: [
            ...question.options,
            {
              label: `Opción ${nextIndex + 1}`,
              value: `opcion_${nextIndex + 1}`,
              riskScore: 0,
            },
          ],
        };
      })
    );
  }

  function removeOption(questionId: string, optionIndex: number) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;
        return {
          ...question,
          options: question.options.filter((_, index) => index !== optionIndex),
        };
      })
    );
  }

  function buildTargets() {
    const targetGrades = Array.from(new Set(targets.map((target) => target.gradeId)));
    const targetSections = Array.from(
      new Set(
        targets.flatMap((target) => {
          const grade = gradesById.get(target.gradeId);
          if (!grade) return [];

          if (target.sectionId === ALL_SECTIONS) {
            return grade.sections.map((section) => section.id);
          }

          return [target.sectionId];
        })
      )
    );

    return { targetGrades, targetSections };
  }

  function validate() {
    if (!title.trim()) return 'Falta el título de la encuesta';
    if (questions.length === 0) return 'Agrega al menos una pregunta';

    for (const [index, question] of questions.entries()) {
      if (!question.text.trim()) return `La pregunta ${index + 1} necesita texto`;

      if (question.riskScore < 0 || question.riskScore > 100) {
        return `El puntaje de la pregunta ${index + 1} debe estar entre 0 y 100`;
      }

      const needsOptions =
        question.type === 'SINGLE' ||
        question.type === 'MULTI' ||
        question.type === 'YES_NO';

      if (needsOptions && question.options.length < 2) {
        return `La pregunta ${index + 1} necesita al menos dos opciones`;
      }

      for (const [optionIndex, option] of question.options.entries()) {
        if (!option.label.trim()) {
          return `La opción ${optionIndex + 1} de la pregunta ${index + 1} necesita texto`;
        }

        if (option.riskScore < 0 || option.riskScore > 100) {
          return `El puntaje de la opción ${optionIndex + 1} debe estar entre 0 y 100`;
        }
      }
    }

    return null;
  }

  function save() {
    const validationError = validate();
    setError(validationError);
    if (validationError) return;

    const { targetGrades, targetSections } = buildTargets();

    startTransition(async () => {
      const result = await createSurveyAction({
        title,
        description,
        targetGrades,
        targetSections,
        questions: questions.map((question) => {
          const needsOptions =
            question.type === 'SINGLE' ||
            question.type === 'MULTI' ||
            question.type === 'YES_NO';

          return {
            type: question.type,
            text: question.text,
            required: question.required,
            riskScore: question.riskScore,
            options: needsOptions ? question.options : undefined,
          };
        }),
      });

      if (result.ok) {
        router.push('/psicologo/encuestas');
        router.refresh();
        return;
      }

      setError(result.error);
    });
  }

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Nueva encuesta</h1>
        <p className="text-sm text-slate-600">
          Crea el formulario que verán los estudiantes en su panel.
        </p>
      </header>

      <section className="card space-y-5">
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <div>
            <label className="label" htmlFor="survey-title">
              Título
            </label>
            <input
              id="survey-title"
              className="input"
              placeholder="Ej. Bienestar emocional semanal"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={pending}
            />
          </div>

          <div>
            <label className="label" htmlFor="target-grade">
              Destinatarios
            </label>
            <select
              id="target-grade"
              className="input"
              value=""
              onChange={(event) => addTarget(event.target.value)}
              disabled={pending || availableGrades.length === 0}
            >
              <option value="">Toda la institución</option>
              {availableGrades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'} {grade.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="survey-description">
            Descripción
          </label>
          <textarea
            id="survey-description"
            className="input min-h-[96px] resize-none"
            placeholder="Texto opcional para explicar el propósito de la encuesta."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={pending}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          {targets.length === 0 ? (
            <p className="text-sm text-slate-600">
              Sin destinatarios específicos: la encuesta aparecerá para todos los estudiantes activos.
            </p>
          ) : (
            <div className="space-y-3">
              {targets.map((target) => {
                const grade = gradesById.get(target.gradeId);

                return (
                  <div
                    key={target.id}
                    className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-center"
                  >
                    <select
                      className="input"
                      value={target.gradeId}
                      onChange={(event) =>
                        updateTarget(target.id, {
                          gradeId: event.target.value,
                          sectionId: ALL_SECTIONS,
                        })
                      }
                      disabled={pending}
                    >
                      {grades.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'} {item.name}
                        </option>
                      ))}
                    </select>

                    <select
                      className="input"
                      value={target.sectionId}
                      onChange={(event) =>
                        updateTarget(target.id, { sectionId: event.target.value })
                      }
                      disabled={pending}
                    >
                      <option value={ALL_SECTIONS}>Todas las secciones</option>
                      {grade?.sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          Sección {section.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="btn-secondary !px-3"
                      onClick={() => removeTarget(target.id)}
                      disabled={pending}
                      aria-label="Quitar destinatario"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="card space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Preguntas</h2>
            <p className="text-sm text-slate-500">
              Ordena, configura opciones y asigna puntajes para alertas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUESTION_TYPES.map((type) => (
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
            Agrega una pregunta para empezar a construir el formulario.
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <QuestionEditor
                key={question.id}
                question={question}
                index={index}
                total={questions.length}
                pending={pending}
                onUpdate={(patch) => updateQuestion(question.id, patch)}
                onRemove={() => removeQuestion(question.id)}
                onMove={(direction) => moveQuestion(question.id, direction)}
                onAddOption={() => addOption(question.id)}
                onUpdateOption={(optionIndex, patch) =>
                  updateOption(question.id, optionIndex, patch)
                }
                onRemoveOption={(optionIndex) =>
                  removeOption(question.id, optionIndex)
                }
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

      <footer className="flex justify-end gap-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={save}
          disabled={pending}
        >
          <Save className="h-4 w-4" />
          {pending ? 'Guardando...' : 'Guardar encuesta'}
        </button>
      </footer>
    </div>
  );
}

function QuestionEditor({
  question,
  index,
  total,
  pending,
  onUpdate,
  onRemove,
  onMove,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: {
  question: DraftQuestion;
  index: number;
  total: number;
  pending: boolean;
  onUpdate: (patch: Partial<DraftQuestion>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onAddOption: () => void;
  onUpdateOption: (optionIndex: number, patch: Partial<Option>) => void;
  onRemoveOption: (optionIndex: number) => void;
}) {
  const hasOptions =
    question.type === 'SINGLE' ||
    question.type === 'MULTI' ||
    question.type === 'YES_NO';

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Pregunta {index + 1}
          </p>
          <p className="text-sm font-medium text-brand-700">{TYPE_LABELS[question.type]}</p>
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            className="btn-secondary !px-2 !py-2"
            onClick={() => onMove(-1)}
            disabled={pending || index === 0}
            aria-label="Subir pregunta"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="btn-secondary !px-2 !py-2"
            onClick={() => onMove(1)}
            disabled={pending || index === total - 1}
            aria-label="Bajar pregunta"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="btn-danger !px-2 !py-2"
            onClick={onRemove}
            disabled={pending}
            aria-label="Eliminar pregunta"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`question-${question.id}`}>
          Texto de la pregunta
        </label>
        <input
          id={`question-${question.id}`}
          className="input"
          placeholder="Escribe la pregunta que verá el estudiante"
          value={question.text}
          onChange={(event) => onUpdate({ text: event.target.value })}
          disabled={pending}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_180px] md:items-end">
        <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(event) => onUpdate({ required: event.target.checked })}
            disabled={pending}
          />
          Obligatoria
        </label>

        <div>
          <label className="label" htmlFor={`risk-${question.id}`}>
            Riesgo base
          </label>
          <input
            id={`risk-${question.id}`}
            className="input"
            type="number"
            min={0}
            max={100}
            value={question.riskScore}
            onChange={(event) =>
              onUpdate({ riskScore: Number(event.target.value) || 0 })
            }
            disabled={pending}
          />
        </div>
      </div>

      {hasOptions && (
        <div className="space-y-3 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800">Opciones</h3>
            {question.type !== 'YES_NO' && (
              <button
                type="button"
                className="btn-secondary !px-3 !py-2 text-xs"
                onClick={onAddOption}
                disabled={pending}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar opción
              </button>
            )}
          </div>

          {question.options.map((option, optionIndex) => (
            <div
              key={`${question.id}-${optionIndex}`}
              className="grid gap-2 md:grid-cols-[1fr_130px_auto] md:items-center"
            >
              <input
                className="input"
                placeholder={`Opción ${optionIndex + 1}`}
                value={option.label}
                onChange={(event) =>
                  onUpdateOption(optionIndex, { label: event.target.value })
                }
                disabled={pending}
              />
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                value={option.riskScore}
                onChange={(event) =>
                  onUpdateOption(optionIndex, {
                    riskScore: Number(event.target.value) || 0,
                  })
                }
                disabled={pending}
                aria-label="Puntaje de riesgo de la opción"
              />
              <button
                type="button"
                className="btn-secondary !px-3"
                onClick={() => onRemoveOption(optionIndex)}
                disabled={pending || question.type === 'YES_NO' || question.options.length <= 2}
                aria-label="Eliminar opción"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
