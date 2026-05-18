'use server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { evaluateResponse } from '@/lib/alert-engine';
import { sendRiskAlertPush } from '@/lib/push';

type SubmitInput = {
  surveyId: string;
  answers: { questionId: string; value: string }[];
};

export async function submitSurveyAction(input: SubmitInput) {
  const session = await requireRole(['STUDENT']);

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    include: { section: true },
  });

  if (!student) {
    return { ok: false as const, error: 'Estudiante no encontrado' };
  }

  const [existingResponse, survey] = await Promise.all([
    prisma.response.findFirst({
      where: {
        surveyId: input.surveyId,
        studentId: student.id,
      },
      select: { id: true },
    }),
    prisma.survey.findUnique({
      where: { id: input.surveyId },
      include: { questions: { orderBy: { order: 'asc' } } },
    }),
  ]);

  if (existingResponse) {
    return { ok: false as const, error: 'Ya respondiste esta encuesta' };
  }

  if (!survey || !survey.isActive) {
    return { ok: false as const, error: 'Encuesta no disponible' };
  }

  if (
    survey.targetGrades.length > 0 &&
    !survey.targetGrades.includes(student.section.gradeId)
  ) {
    return { ok: false as const, error: 'Encuesta no disponible para tu grado' };
  }

  if (
    survey.targetSections.length > 0 &&
    !survey.targetSections.includes(student.sectionId)
  ) {
    return { ok: false as const, error: 'Encuesta no disponible para tu sección' };
  }

  const answersByQuestion = new Map(input.answers.map((answer) => [answer.questionId, answer]));

  for (const q of survey.questions) {
    if (q.required) {
      const a = answersByQuestion.get(q.id);

      if (!a || !a.value || a.value.trim() === '') {
        return {
          ok: false as const,
          error: `Falta responder: ${q.text}`,
        };
      }
    }
  }

  const evaluationInput = survey.questions.map((q) => {
    const ans = answersByQuestion.get(q.id);
    const value = ans?.value || '';
    const opts: any[] = (q.options as any) || [];
    const opt = opts.find((o: any) => o.value === value);

    return {
      questionId: q.id,
      questionOrder: q.order,
      questionType: q.type,
      value,
      optionRiskScore: (opt?.riskScore || 0) + (q.riskScore || 0),
    };
  });

  const evaluation = await evaluateResponse(evaluationInput);

  const wantsToTalk = survey.questions.some((q) => {
    if (!/psic[oó]logo/i.test(q.text)) return false;

    const ans = answersByQuestion.get(q.id);
    return ans?.value === 'si';
  });

  const response = await prisma.response.create({
    data: {
      surveyId: survey.id,
      studentId: student.id,
      riskFlag: evaluation.riskFlag,
      riskScore: evaluation.totalScore,
      riskLevel: evaluation.riskLevel,
      wantsToTalk,
      answers: {
        create: input.answers.map((a) => ({
          questionId: a.questionId,
          value: a.value,
        })),
      },
      alerts: {
        create: evaluation.triggeredRules.map((t) => ({
          ruleId: t.ruleId,
          severity: t.severity,
          detail: t.detail,
        })),
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: 'SUBMIT_RESPONSE',
      entity: 'Response',
      entityId: response.id,
    },
  });

  if (evaluation.riskFlag) {
    await sendRiskAlertPush({
      riskLevel: evaluation.riskLevel,
      riskScore: evaluation.totalScore,
    });
  }

  return { ok: true as const, responseId: response.id };
}
