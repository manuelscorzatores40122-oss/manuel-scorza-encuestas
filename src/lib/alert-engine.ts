import { prisma } from './prisma';
import type { AlertRule } from '@prisma/client';

type AnswerInput = {
  questionId: string;
  questionOrder: number;
  questionType: string;
  value: string;
  optionRiskScore?: number;
};

type EvaluationResult = {
  totalScore: number;
  riskLevel: 'LOW' | 'MID' | 'HIGH';
  riskFlag: boolean;
  triggeredRules: { ruleId: string; severity: string; detail: string }[];
};

/**
 * Evalúa una respuesta contra las reglas activas.
 * Tres mecanismos en paralelo:
 *  1. KEYWORD: busca palabras clave en respuestas tipo TEXT
 *  2. COMBINATION: verifica combinaciones de respuestas
 *  3. SCORE: suma puntos y compara contra umbrales
 */
export async function evaluateResponse(answers: AnswerInput[]): Promise<EvaluationResult> {
  const rules = await prisma.alertRule.findMany({ where: { isActive: true } });

  const totalScore = answers.reduce((acc, a) => acc + (a.optionRiskScore || 0), 0);
  const triggered: { ruleId: string; severity: string; detail: string }[] = [];

  for (const rule of rules) {
    const detail = evaluateRule(rule, answers, totalScore);
    if (detail) {
      triggered.push({ ruleId: rule.id, severity: rule.severity, detail });
    }
  }

  // Nivel de riesgo final = mayor severidad disparada o por score
  let riskLevel: 'LOW' | 'MID' | 'HIGH' = 'LOW';
  if (triggered.some((t) => t.severity === 'HIGH')) riskLevel = 'HIGH';
  else if (triggered.some((t) => t.severity === 'MID') || totalScore >= 8) riskLevel = 'MID';
  else if (totalScore >= 4) riskLevel = 'MID';

  return {
    totalScore,
    riskLevel,
    riskFlag: triggered.length > 0 || riskLevel !== 'LOW',
    triggeredRules: triggered,
  };
}

function evaluateRule(
  rule: AlertRule,
  answers: AnswerInput[],
  totalScore: number
): string | null {
  const cfg = rule.config as any;

  if (rule.type === 'KEYWORD') {
    const keywords: string[] = (cfg?.keywords || []).map((k: string) => k.toLowerCase());
    const textAnswers = answers.filter((a) => a.questionType === 'TEXT');
    for (const a of textAnswers) {
      const lower = (a.value || '').toLowerCase();
      const found = keywords.find((k) => lower.includes(k));
      if (found) return `Palabra clave detectada: "${found}"`;
    }
    return null;
  }

  if (rule.type === 'COMBINATION') {
    const conds: { questionOrder: number; valueIn: string[] }[] = cfg?.rules || [];
    if (conds.length === 0) return null;
    const allMatch = conds.every((c) => {
      const ans = answers.find((a) => a.questionOrder === c.questionOrder);
      if (!ans) return false;
      return c.valueIn.includes(ans.value);
    });
    return allMatch ? `Combinación de respuestas de riesgo` : null;
  }

  if (rule.type === 'SCORE') {
    const threshold = Number(cfg?.threshold || 0);
    if (totalScore >= threshold) {
      return `Score acumulado ${totalScore} ≥ umbral ${threshold}`;
    }
    return null;
  }

  return null;
}
