'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const optionSchema = z.object({
  label: z.string().trim().min(1, 'Cada opción necesita una etiqueta'),
  value: z.string().trim().min(1, 'Cada opción necesita un valor'),
  riskScore: z.coerce.number().int().min(0).max(100),
});

const questionSchema = z.object({
  type: z.enum(['SINGLE', 'MULTI', 'SCALE', 'TEXT', 'YES_NO']),
  text: z.string().trim().min(1, 'Cada pregunta necesita texto'),
  required: z.boolean(),
  riskScore: z.coerce.number().int().min(0).max(100),
  options: z.array(optionSchema).optional(),
});

const createSurveySchema = z.object({
  title: z.string().trim().min(1, 'Falta el título'),
  description: z.string().trim().optional(),
  targetGrades: z.array(z.string().trim().min(1)).default([]),
  targetSections: z.array(z.string().trim().min(1)).default([]),
  questions: z.array(questionSchema).min(1, 'Agrega al menos una pregunta'),
});

type CreateSurveyInput = z.input<typeof createSurveySchema>;
type SurveyActionResult =
  | { ok: true; surveyId: string }
  | { ok: false; error: string };

export async function createSurveyAction(input: CreateSurveyInput): Promise<SurveyActionResult> {
  const session = await requireRole(['PSYCHOLOGIST']);
  const parsed = createSurveySchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || 'Datos inválidos',
    };
  }

  const { title, description, targetGrades, targetSections, questions } = parsed.data;

  for (const question of questions) {
    const needsOptions = question.type === 'SINGLE' || question.type === 'MULTI' || question.type === 'YES_NO';

    if (needsOptions && (!question.options || question.options.length === 0)) {
      return {
        ok: false,
        error: `La pregunta "${question.text}" necesita opciones`,
      };
    }

    if (!needsOptions && question.options?.length) {
      return {
        ok: false,
        error: `La pregunta "${question.text}" no debe enviar opciones`,
      };
    }
  }

  const validGrades = targetGrades.length
    ? await prisma.grade.count({
        where: {
          id: {
            in: targetGrades,
          },
        },
      })
    : 0;

  if (targetGrades.length > 0 && validGrades !== targetGrades.length) {
    return {
      ok: false,
      error: 'Uno o más grados seleccionados no existen',
    };
  }

  const validSections = targetSections.length
    ? await prisma.section.findMany({
        where: {
          id: {
            in: targetSections,
          },
        },
        select: {
          id: true,
          gradeId: true,
        },
      })
    : [];

  if (targetSections.length > 0 && validSections.length !== targetSections.length) {
    return {
      ok: false,
      error: 'Una o más secciones seleccionadas no existen',
    };
  }

  if (
    targetSections.length > 0 &&
    validSections.some((section) => !targetGrades.includes(section.gradeId))
  ) {
    return {
      ok: false,
      error: 'Todas las secciones deben pertenecer a los grados seleccionados',
    };
  }

  const survey = await prisma.survey.create({
    data: {
      title,
      description: description || null,
      createdById: session.userId,
      targetGrades,
      targetSections,
      questions: {
        create: questions.map((question, index) => ({
          type: question.type,
          text: question.text,
          required: question.required,
          riskScore: question.riskScore,
          order: index + 1,
          options: question.options || undefined,
        })),
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: 'CREATE_SURVEY',
      entity: 'Survey',
      entityId: survey.id,
    },
  });

  revalidatePath('/psicologo/encuestas');

  return {
    ok: true,
    surveyId: survey.id,
  };
}

export async function toggleSurveyAction(id: string) {
  await requireRole(['PSYCHOLOGIST', 'ADMIN']);

  const survey = await prisma.survey.findUnique({
    where: { id },
    select: { isActive: true },
  });

  if (!survey) return { ok: false as const, error: 'Encuesta no encontrada' };

  await prisma.survey.update({
    where: { id },
    data: {
      isActive: !survey.isActive,
    },
  });

  revalidatePath('/psicologo/encuestas');
  revalidatePath('/estudiante', 'layout');

  return { ok: true as const };
}

type QuestionInput = {
  dbId?:     string;   // undefined = pregunta nueva
  type:      'SINGLE' | 'MULTI' | 'SCALE' | 'TEXT' | 'YES_NO';
  text:      string;
  required:  boolean;
  riskScore: number;
  options?:  { label: string; value: string; riskScore: number }[];
};

export async function updateSurveyQuestionsAction(
  surveyId: string,
  questions: QuestionInput[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(['PSYCHOLOGIST', 'ADMIN']);

  if (questions.length === 0)
    return { ok: false, error: 'La encuesta debe tener al menos una pregunta' };

  for (const [i, q] of questions.entries()) {
    if (!q.text.trim()) return { ok: false, error: `La pregunta ${i + 1} necesita texto` };
  }

  const existing = await prisma.question.findMany({
    where:  { surveyId },
    select: { id: true },
  });

  const submittedDbIds = new Set(questions.map(q => q.dbId).filter(Boolean));

  // Eliminar solo preguntas sin respuestas asociadas
  for (const { id } of existing) {
    if (!submittedDbIds.has(id)) {
      const hasAnswers = await prisma.answer.count({ where: { questionId: id } });
      if (hasAnswers === 0) await prisma.question.delete({ where: { id } });
    }
  }

  // Actualizar existentes / crear nuevas
  for (let i = 0; i < questions.length; i++) {
    const q     = questions[i];
    const order = i + 1;
    const needsOptions = ['SINGLE', 'MULTI', 'YES_NO'].includes(q.type);
    const options = needsOptions ? (q.options ?? []) : undefined;

    if (q.dbId) {
      await prisma.question.update({
        where: { id: q.dbId },
        data:  { text: q.text.trim(), required: q.required, riskScore: q.riskScore, order, options },
      });
    } else {
      await prisma.question.create({
        data: { surveyId, type: q.type, text: q.text.trim(), required: q.required, riskScore: q.riskScore, order, options },
      });
    }
  }

  revalidatePath('/psicologo/encuestas');
  revalidatePath(`/psicologo/encuestas/${surveyId}`);
  return { ok: true };
}

export async function updateSurveyAction(
  id: string,
  title: string,
  description: string,
  targetGrades: string[]   = [],
  targetSections: string[] = [],
) {
  await requireRole(['PSYCHOLOGIST', 'ADMIN']);

  const data: Record<string, unknown> = {
    targetGrades:   targetGrades,
    targetSections: targetSections,
  };
  if (title.trim()) {
    data.title       = title.trim();
    data.description = description.trim() || null;
  }

  await prisma.survey.update({ where: { id }, data });

  revalidatePath('/psicologo/encuestas');
  revalidatePath('/estudiante', 'layout');
  return { ok: true as const };
}

export async function deleteSurveyAction(id: string) {
  await requireRole(['PSYCHOLOGIST', 'ADMIN']);

  await prisma.$transaction(async (tx) => {
    await tx.response.deleteMany({
      where: {
        surveyId: id,
      },
    });

    await tx.question.deleteMany({
      where: {
        surveyId: id,
      },
    });

    await tx.survey.delete({
      where: {
        id,
      },
    });
  });

  revalidatePath('/psicologo/encuestas');
  revalidatePath('/psicologo/respuestas');
  revalidatePath('/psicologo/alertas');
  revalidatePath('/psicologo/estadisticas');

  return { ok: true as const, mode: 'deleted' as const };
}
