import ExcelJS from 'exceljs';
import { evaluateResponse } from './alert-engine';
import { sendRiskAlertPush } from './push';
import { prisma } from './prisma';

type ImportError = {
  fila: number;
  razon: string;
};

export type ImportResponsesResult = {
  total: number;
  importados: number;
  omitidos: number;
  errores: ImportError[];
};

type QuestionWithOptions = {
  id: string;
  order: number;
  type: string;
  text: string;
  required: boolean;
  riskScore: number;
  options: unknown;
};

export async function importSurveyResponsesExcel(
  buffer: Buffer,
  surveyId: string
): Promise<ImportResponsesResult> {
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: { questions: { orderBy: { order: 'asc' } } },
  });

  if (!survey) {
    throw new Error('Encuesta no encontrada');
  }

  if (survey.questions.length === 0) {
    throw new Error('La encuesta no tiene preguntas');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error('El archivo no tiene hojas');
  }

  const headerRow = worksheet.getRow(1);
  const headers = new Map<string, number>();

  headerRow.eachCell((cell, colNumber) => {
    const value = normalizeHeader(cellToString(cell.value));
    if (value) headers.set(value, colNumber);
  });

  const dniColumn = findColumn(headers, ['dni', 'documento', 'numero documento', 'numero de documento']);

  if (!dniColumn) {
    throw new Error('El Excel debe tener una columna DNI');
  }

  const questionColumns = survey.questions.map((question) => ({
    question,
    column: findQuestionColumn(headers, question),
  }));

  const result: ImportResponsesResult = {
    total: 0,
    importados: 0,
    omitidos: 0,
    errores: [],
  };

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const dni = cellToString(row.getCell(dniColumn).value).trim();

    if (!dni) continue;

    result.total++;

    try {
      const student = await prisma.student.findUnique({
        where: { dni },
        include: { section: true },
      });

      if (!student) {
        result.errores.push({ fila: rowNumber, razon: `No existe estudiante con DNI ${dni}` });
        continue;
      }

      if (survey.targetGrades.length > 0 && !survey.targetGrades.includes(student.section.gradeId)) {
        result.omitidos++;
        result.errores.push({ fila: rowNumber, razon: 'El estudiante no pertenece a los grados objetivo' });
        continue;
      }

      if (survey.targetSections.length > 0 && !survey.targetSections.includes(student.sectionId)) {
        result.omitidos++;
        result.errores.push({ fila: rowNumber, razon: 'El estudiante no pertenece a las secciones objetivo' });
        continue;
      }

      const existing = await prisma.response.findFirst({
        where: {
          surveyId: survey.id,
          studentId: student.id,
        },
        select: { id: true },
      });

      if (existing) {
        result.omitidos++;
        continue;
      }

      const parsedAnswers = questionColumns.map(({ question, column }) => {
        const raw = column ? cellToString(row.getCell(column).value).trim() : '';
        return parseAnswer(question, raw);
      });

      const invalid = parsedAnswers.find((answer) => !answer.ok);
      if (invalid && !invalid.ok) {
        result.errores.push({ fila: rowNumber, razon: invalid.error });
        continue;
      }

      const answers = parsedAnswers
        .filter((answer): answer is Extract<typeof answer, { ok: true }> => answer.ok)
        .map((answer) => answer.answer);

      const evaluationInput = answers.map((answer) => ({
        questionId: answer.question.id,
        questionOrder: answer.question.order,
        questionType: answer.question.type,
        value: answer.value,
        optionRiskScore: answer.optionRiskScore,
      }));

      const evaluation = await evaluateResponse(evaluationInput);
      const wantsToTalk = answers.some((answer) => (
        /psic[oó]logo/i.test(answer.question.text) && answer.value === 'si'
      ));

      await prisma.response.create({
        data: {
          surveyId: survey.id,
          studentId: student.id,
          riskFlag: evaluation.riskFlag,
          riskScore: evaluation.totalScore,
          riskLevel: evaluation.riskLevel,
          wantsToTalk,
          answers: {
            create: answers.map((answer) => ({
              questionId: answer.question.id,
              value: answer.value,
            })),
          },
          alerts: {
            create: evaluation.triggeredRules.map((triggered) => ({
              ruleId: triggered.ruleId,
              severity: triggered.severity,
              detail: triggered.detail,
            })),
          },
        },
      });

      if (evaluation.riskFlag) {
        await sendRiskAlertPush({
          riskLevel: evaluation.riskLevel,
          riskScore: evaluation.totalScore,
        });
      }

      result.importados++;
    } catch (error: any) {
      result.errores.push({
        fila: rowNumber,
        razon: error.message || 'Error al procesar la fila',
      });
    }
  }

  return result;
}

function findQuestionColumn(headers: Map<string, number>, question: QuestionWithOptions) {
  return findColumn(headers, [
    question.id,
    question.text,
    `p${question.order}`,
    `pregunta ${question.order}`,
    `q${question.order}`,
  ]);
}

function findColumn(headers: Map<string, number>, aliases: string[]) {
  for (const alias of aliases) {
    const normalized = normalizeHeader(alias);
    const column = headers.get(normalized);
    if (column) return column;
  }

  return null;
}

function parseAnswer(question: QuestionWithOptions, raw: string) {
  if (!raw) {
    if (question.required) {
      return {
        ok: false as const,
        error: `Falta responder P${question.order}: ${question.text}`,
      };
    }

    return {
      ok: true as const,
      answer: {
        question,
        value: '',
        optionRiskScore: 0,
      },
    };
  }

  if (question.type === 'TEXT') {
    return successfulAnswer(question, raw, question.riskScore);
  }

  if (question.type === 'SCALE') {
    const value = String(Number(raw));
    if (!['1', '2', '3', '4', '5'].includes(value)) {
      return {
        ok: false as const,
        error: `P${question.order} debe tener un valor de 1 a 5`,
      };
    }

    return successfulAnswer(question, value, question.riskScore);
  }

  const options = normalizeOptions(question.options);

  if (question.type === 'MULTI') {
    const values = splitMultiValue(raw).map((value) => matchOptionValue(value, options));

    if (values.some((value) => !value)) {
      return {
        ok: false as const,
        error: `P${question.order} contiene una opción no válida`,
      };
    }

    const selectedValues = values.filter(Boolean) as string[];
    const optionRiskScore = selectedValues.reduce((sum, value) => {
      return sum + (options.find((option) => option.value === value)?.riskScore || 0);
    }, question.riskScore);

    return successfulAnswer(question, JSON.stringify(selectedValues), optionRiskScore);
  }

  if (question.type === 'SINGLE' || question.type === 'YES_NO') {
    const value = matchOptionValue(raw, options);

    if (!value) {
      return {
        ok: false as const,
        error: `P${question.order} contiene una opción no válida`,
      };
    }

    const optionRiskScore = (options.find((option) => option.value === value)?.riskScore || 0) + question.riskScore;
    return successfulAnswer(question, value, optionRiskScore);
  }

  return successfulAnswer(question, raw, question.riskScore);
}

function successfulAnswer(question: QuestionWithOptions, value: string, optionRiskScore: number) {
  return {
    ok: true as const,
    answer: {
      question,
      value,
      optionRiskScore,
    },
  };
}

function matchOptionValue(raw: string, options: { label: string; value: string; riskScore: number }[]) {
  const normalized = normalizeHeader(raw);

  if (normalized === 'si') {
    const yes = options.find((option) => normalizeHeader(option.value) === 'si' || normalizeHeader(option.label) === 'si');
    if (yes) return yes.value;
  }

  const option = options.find((item) => (
    normalizeHeader(item.value) === normalized ||
    normalizeHeader(item.label) === normalized
  ));

  return option?.value || null;
}

function normalizeOptions(options: unknown) {
  if (!Array.isArray(options)) return [];

  return options
    .map((option: any) => ({
      label: String(option?.label || ''),
      value: String(option?.value || ''),
      riskScore: Number(option?.riskScore || 0),
    }))
    .filter((option) => option.label && option.value);
}

function splitMultiValue(raw: string) {
  const trimmed = raw.trim();

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return [raw];
    }
  }

  return raw
    .split(/[,;|]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeHeader(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function cellToString(value: ExcelJS.CellValue) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if ('text' in value) return String(value.text || '');
    if ('result' in value) return String(value.result || '');
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join('');
    }
    if ('hyperlink' in value && 'text' in value) return String(value.text || '');
  }

  return String(value);
}
