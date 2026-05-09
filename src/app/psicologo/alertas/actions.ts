'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function markAlertReviewedAction(alertId: string) {
  await requireRole(['PSYCHOLOGIST']);
  await prisma.alert.update({
    where: { id: alertId },
    data: { reviewedAt: new Date() },
  });
  revalidatePath('/psicologo/alertas');
}
