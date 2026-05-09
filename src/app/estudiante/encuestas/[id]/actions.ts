'use server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { evaluateResponse } from '@/lib/alert-engine';

type SubmitInput = {
  surveyId: string;
  answers: { questionId: string; value: string }[];
};

export async function submitSurveyAction(input: SubmitInput) {
  const session = await requireRole(['STUDENT']);

  const student = await prisma.student.findUnique({ where: { userId: session.userId } });
  if (!student) return { ok: false as const, error: 'Estudiante no encontrado' };

  const survey = await prisma.survey.findUnique({
    where: { id: input.surveyId },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  if (!survey || !survey.isActive) {
    return { ok: false as const, error: 'Encuesta no disponible' };
  }

  // Validar respuestas requeridas
  for (const q of survey.questions) {
    if (q.required) {
      const a = input.answers.find((x) => x.questionId === q.id);
      if (!a || !a.value || a.value.trim() === '') {
        return { ok: false as const, error: `Falta responder: ${q.text}` };
      }
    }
  }

  // Construir input para el motor de alertas
  const evaluationInput = survey.questions.map((q) => {
    const ans = input.answers.find((x) => x.questionId === q.id);
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

  // Detectar "quiere hablar con psicólogo"
  const wantsToTalk = survey.questions.some((q) => {
    if (!/psic[oó]logo/i.test(q.text)) return false;
    const ans = input.answers.find((x) => x.questionId === q.id);
    return ans?.value === 'si';
  });

  // Crear respuesta + answers + alertas en transacción
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

  return { ok: true as const, responseId: response.id };
}
