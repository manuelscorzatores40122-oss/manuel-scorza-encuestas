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
