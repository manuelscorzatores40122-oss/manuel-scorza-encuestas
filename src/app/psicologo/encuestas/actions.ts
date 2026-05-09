'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function toggleSurveyAction(id: string) {
  await requireRole(['PSYCHOLOGIST', 'ADMIN']);
  const s = await prisma.survey.findUnique({ where: { id } });
  if (!s) return;
  await prisma.survey.update({
    where: { id },
    data: { isActive: !s.isActive },
  });
  revalidatePath('/psicologo/encuestas');
}

type CreateSurveyInput = {
  title: string;
  description?: string;
  targetGrades: string[];
  questions: {
    type: 'SINGLE' | 'MULTI' | 'SCALE' | 'TEXT' | 'YES_NO';
    text: string;
    required: boolean;
    options?: { label: string; value: string; riskScore: number }[];
    riskScore?: number;
  }[];
};

export async function createSurveyAction(input: CreateSurveyInput) {
  const session = await requireRole(['PSYCHOLOGIST']);
  if (!input.title.trim()) return { ok: false as const, error: 'El título es obligatorio' };
  if (input.questions.length === 0) return { ok: false as const, error: 'Debes agregar al menos una pregunta' };

  const survey = await prisma.survey.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      isActive: true,
      createdById: session.userId,
      targetGrades: input.targetGrades,
      targetSections: [],
      questions: {
        create: input.questions.map((q, i) => ({
          type: q.type,
          text: q.text.trim(),
          required: q.required,
          order: i + 1,
          riskScore: q.riskScore || 0,
          options: q.options ?? Prisma.JsonNull,
        })),
      },
    },
  });

  revalidatePath('/psicologo/encuestas');
  return { ok: true as const, surveyId: survey.id };
}
