'use server';

import { revalidatePath } from 'next/cache';
import { AlertRuleType } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function saveRuleAction(rule: any) {
  const session = await requireRole(['ADMIN']);
  if (!rule.name?.trim()) return { ok: false as const, error: 'Falta nombre' };

  if (rule.id) {
    await prisma.alertRule.update({
      where: { id: rule.id },
      data: {
        name: rule.name,
        type: rule.type as AlertRuleType,
        severity: rule.severity,
        config: rule.config,
        isActive: rule.isActive,
      },
    });
  } else {
    await prisma.alertRule.create({
      data: {
        name: rule.name,
        type: rule.type as AlertRuleType,
        severity: rule.severity,
        config: rule.config,
        isActive: true,
        createdById: session.userId,
      },
    });
  }
  revalidatePath('/admin/reglas');
  return { ok: true as const };
}

export async function toggleRuleAction(id: string) {
  await requireRole(['ADMIN']);
  const r = await prisma.alertRule.findUnique({ where: { id } });
  if (!r) return;
  await prisma.alertRule.update({ where: { id }, data: { isActive: !r.isActive } });
  revalidatePath('/admin/reglas');
}

export async function deleteRuleAction(id: string) {
  await requireRole(['ADMIN']);
  await prisma.alertRule.delete({ where: { id } });
  revalidatePath('/admin/reglas');
}
