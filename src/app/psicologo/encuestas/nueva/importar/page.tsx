'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, Save, Download, FileText,
  X, CheckCircle2, XCircle, FileSpreadsheet,
} from 'lucide-react';
import { createSurveyAction } from '../../actions';
import styles from './importar.module.css';

/* ══════════════════════════════════════
   TIPOS
   ══════════════════════════════════════ */
type Option   = { label: string; value: string; riskScore: number };
type Question = { type: 'SINGLE'|'MULTI'|'SCALE'|'TEXT'|'YES_NO'; text: string; required: boolean; riskScore: number; options: Option[] };
type Survey   = { title: string; description: string; targetGrades: string[]; questions: Question[] };

const QUESTION_TYPES = ['SINGLE','MULTI','SCALE','TEXT','YES_NO'] as const;

function toQuestionType(v: string): Question['type'] {
  return QUESTION_TYPES.includes(v as Question['type']) ? (v as Question['type']) : 'TEXT';
}

/* ══════════════════════════════════════
   PARSER CSV ROBUSTO (maneja campos entre comillas y comas internas)
   ══════════════════════════════════════ */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      fields.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

function parseCSV(text: string) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());
  if (lines.length < 2) throw new Error('El archivo no tiene datos');

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/^["']|["']$/g, ''));
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

function buildSurvey(rows: Record<string, string>[]): Survey {
  if (!rows.length) throw new Error('CSV vacío');

  const map = new Map<string, Question>();
  const title       = rows[0].survey_title       || 'Encuesta importada';
  const description = rows[0].survey_description || '';

  for (const r of rows) {
    const qText = r.question_text?.trim();
    if (!qText) continue;

    if (!map.has(qText)) {
      map.set(qText, {
        type:      toQuestionType((r.question_type || 'TEXT').trim().toUpperCase()),
        text:      qText,
        required:  (r.required || '').toLowerCase() === 'true',
        riskScore: Number(r.question_risk_score ?? 0),
        options:   [],
      });
    }

    if (r.option_label?.trim()) {
      map.get(qText)!.options.push({
        label:     r.option_label.trim(),
        value:     r.option_value?.trim() || r.option_label.trim().toLowerCase().replace(/\s+/g, '_'),
        riskScore: Number(r.risk_score ?? 0),
      });
    }
  }

  return { title, description, targetGrades: [], questions: Array.from(map.values()) };
}

/* ══════════════════════════════════════
   PLANTILLA CSV DE DESCARGA
   ══════════════════════════════════════ */
const CSV_TEMPLATE = [
  'survey_title,survey_description,question_type,question_text,required,question_risk_score,option_label,option_value,risk_score',
  // SINGLE (pregunta con opciones de selección única)
  '"Bienestar Emocional","Encuesta de salud mental estudiantil",SINGLE,"¿Cómo te has sentido esta semana?",true,10,"Muy bien",muy_bien,0',
  '"Bienestar Emocional","Encuesta de salud mental estudiantil",SINGLE,"¿Cómo te has sentido esta semana?",true,10,"Bien",bien,5',
  '"Bienestar Emocional","Encuesta de salud mental estudiantil",SINGLE,"¿Cómo te has sentido esta semana?",true,10,"Regular",regular,15',
  '"Bienestar Emocional","Encuesta de salud mental estudiantil",SINGLE,"¿Cómo te has sentido esta semana?",true,10,"Mal",mal,25',
  '"Bienestar Emocional","Encuesta de salud mental estudiantil",SINGLE,"¿Cómo te has sentido esta semana?",true,10,"Muy mal",muy_mal,40',
  // MULTI (selección múltiple)
  '"Bienestar Emocional","Encuesta de salud mental estudiantil",MULTI,"¿Qué sentimientos has experimentado?",false,5,"Tristeza",tristeza,20',
  '"Bienestar Emocional","Encuesta de salud mental estudiantil",MULTI,"¿Qué sentimientos has experimentado?",false,5,"Ansiedad",ansiedad,25',
  '"Bienestar Emocional","Encuesta de salud mental estudiantil",MULTI,"¿Qué sentimientos has experimentado?",false,5,"Alegría",alegria,0',
  '"Bienestar Emocional","Encuesta de salud mental estudiantil",MULTI,"¿Qué sentimientos has experimentado?",false,5,"Calma",calma,0',
  // YES_NO
  '"Bienestar Emocional","Encuesta de salud mental estudiantil",YES_NO,"¿Has tenido pensamientos que te preocupen?",true,20,"Sí",si,30',
  '"Bienestar Emocional","Encuesta de salud mental estudiantil",YES_NO,"¿Has tenido pensamientos que te preocupen?",true,20,"No",no,0',
  // SCALE (sin opciones)
  '"Bienestar Emocional","Encuesta de salud mental estudiantil",SCALE,"Del 1 al 5, ¿cómo calificarías tu energía diaria?",true,8,,,',
  // TEXT (sin opciones)
  '"Bienestar Emocional","Encuesta de salud mental estudiantil",TEXT,"¿Hay algo más que quieras comentarnos?",false,0,,,',
].join('\n');

function downloadTemplate() {
  const blob = new Blob(['﻿' + CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'plantilla_encuesta.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════
   COLUMNAS DE LA PLANTILLA (documentación)
   ══════════════════════════════════════ */
const COLUMNS = [
  { name: 'survey_title',         req: true,  desc: 'Título de la encuesta (igual en todas las filas)' },
  { name: 'survey_description',   req: false, desc: 'Descripción de la encuesta' },
  { name: 'question_type',        req: true,  desc: 'SINGLE · MULTI · SCALE · TEXT · YES_NO' },
  { name: 'question_text',        req: true,  desc: 'Texto de la pregunta (repite por cada opción)' },
  { name: 'required',             req: false, desc: 'true o false (default: false)' },
  { name: 'question_risk_score',  req: false, desc: 'Peso de riesgo de la pregunta (0–100)' },
  { name: 'option_label',         req: false, desc: 'Texto de la opción (dejar vacío en SCALE y TEXT)' },
  { name: 'option_value',         req: false, desc: 'Valor interno de la opción (auto si vacío)' },
  { name: 'risk_score',           req: false, desc: 'Puntuación de riesgo de la opción (0–100)' },
];

/* ══════════════════════════════════════
   PÁGINA
   ══════════════════════════════════════ */
export default function ImportCSVPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview,  setPreview]  = useState<Survey | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setFileName(file.name);
    try {
      const text   = await file.text();
      const rows   = parseCSV(text);
      const survey = buildSurvey(rows);
      if (!survey.questions.length) throw new Error('No se encontraron preguntas válidas');
      setPreview(survey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al leer el archivo CSV');
      setPreview(null);
    }
  };

  const save = () => {
    if (!preview) return;
    startTransition(async () => {
      const result = await createSurveyAction({
        title:          preview.title,
        description:    preview.description,
        targetGrades:   preview.targetGrades,
        targetSections: [],
        questions:      preview.questions,
      });
      if (result?.ok) router.push('/psicologo/encuestas');
      else setError(result?.error || 'Error al importar la encuesta');
    });
  };

  return (
    <div className={styles.page}>

      {/* Banner */}
      <div className={styles.banner}>
        <div className={styles.bannerIcon}>
          <FileSpreadsheet className={styles.bannerIconSvg} />
        </div>
        <div className={styles.bannerText}>
          <h1 className={styles.bannerTitle}>Importar encuesta desde CSV</h1>
          <p className={styles.bannerSub}>Descarga la plantilla, llénala y súbela aquí</p>
        </div>
      </div>

      {/* Plantilla descargable */}
      <div className={styles.templateCard}>
        <div className={styles.templateHead}>
          <div className={styles.templateHeadLeft}>
            <div className={styles.templateHeadIcon}>
              <FileText className={styles.templateHeadIconSvg} />
            </div>
            <div>
              <p className={styles.templateHeadTitle}>Plantilla CSV</p>
              <p className={styles.templateHeadSub}>Incluye ejemplos de todos los tipos de pregunta</p>
            </div>
          </div>
          <button onClick={downloadTemplate} className={styles.downloadBtn}>
            <Download className={styles.downloadBtnIcon} />
            Descargar plantilla
          </button>
        </div>

        <div className={styles.templateBody}>
          <table className={styles.colTable}>
            <thead>
              <tr>
                <th>Columna</th>
                <th>Obligatoria</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {COLUMNS.map((col) => (
                <tr key={col.name}>
                  <td><span className={styles.colName}>{col.name}</span></td>
                  <td>
                    <span className={`${styles.colRequired} ${col.req ? styles.yes : styles.no}`}>
                      {col.req ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td>{col.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zona de carga */}
      <div className={styles.uploadCard}>
        <div className={styles.uploadHead}>
          <p className={styles.uploadHeadTitle}>Subir archivo CSV</p>
        </div>
        <div className={styles.uploadBody}>
          <div
            className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file?.name.endsWith('.csv')) handleFile(file);
              else setError('Solo se aceptan archivos .csv');
            }}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className={styles.dropZoneInput}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <Upload className={styles.dropZoneIcon} />
            <p className={styles.dropZoneText}>
              {dragging ? 'Suelta el archivo aquí' : 'Haz clic o arrastra tu CSV aquí'}
            </p>
            <p className={styles.dropZoneSub}>Solo archivos .csv</p>
            {fileName && (
              <span className={styles.fileName}>
                <FileText className={styles.fileNameIcon} />
                {fileName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <XCircle className={styles.errorIcon} />
          {error}
        </div>
      )}

      {/* Vista previa */}
      {preview && (
        <div className={styles.previewCard}>
          <div className={styles.previewHead}>
            <h2 className={styles.previewTitle}>Vista previa</h2>
            <span className={styles.previewBadge}>
              {preview.questions.length} pregunta{preview.questions.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className={styles.previewMeta}>
            <p className={styles.previewSurveyTitle}>{preview.title}</p>
            {preview.description && (
              <p className={styles.previewSurveyDesc}>{preview.description}</p>
            )}
          </div>

          <div className={styles.questionList}>
            {preview.questions.map((q, i) => (
              <div key={i} className={styles.questionItem}>
                <div className={styles.questionHeader}>
                  <span className={styles.questionNum}>{i + 1}</span>
                  <span className={styles.questionText}>{q.text}</span>
                  <span className={styles.questionTypeBadge}>{q.type}</span>
                </div>

                {q.options.length > 0 && (
                  <div className={styles.questionOptions}>
                    {q.options.map((o, j) => (
                      <div key={j} className={styles.questionOption}>
                        <span className={styles.optionDot} />
                        {o.label}
                        {o.riskScore > 0 && (
                          <span className={styles.riskPill}>riesgo {o.riskScore}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={() => router.back()}>
          <X className={styles.importBtnIcon} />
          Cancelar
        </button>
        <button
          className={styles.importBtn}
          onClick={save}
          disabled={!preview || pending}
        >
          {pending
            ? <><Save className={styles.importBtnIcon} /> Guardando...</>
            : <><CheckCircle2 className={styles.importBtnIcon} /> Importar encuesta</>}
        </button>
      </div>

    </div>
  );
}
