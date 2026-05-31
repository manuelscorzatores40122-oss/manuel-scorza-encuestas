'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAnnouncement, deleteAnnouncement, toggleAnnouncement } from '@/lib/announcements';
import { sendAnnouncementPush } from '@/lib/push';
import type { Role } from '@prisma/client';

export async function createAnnouncementAction(formData: FormData) {
  const session = await requireRole(['ADMIN', 'PSYCHOLOGIST']);
  const title = String(formData.get('title') || '').trim();
  const content = String(formData.get('content') || '').trim();
  const targetRoles = formData.getAll('targetRoles').map(String);

  if (!title || !content) {
    return { ok: false as const, error: 'Completa el título y el mensaje.' };
  }

  const announcementId = crypto.randomUUID();
  const roles = (targetRoles.length > 0 ? targetRoles : ['STUDENT']) as Role[];

  await createAnnouncement({
    id: announcementId,
    title,
    content,
    targetRoles: roles,
    createdById: session.userId,
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: 'CREATE_ANNOUNCEMENT',
      entity: 'Announcement',
      entityId: announcementId,
      metadata: { title, targetRoles: roles } as any,
    },
  });

  const pushResult = await sendAnnouncementPush({ title, content, targetRoles: roles });

  revalidatePath('/admin/anuncios');
  revalidatePath('/psicologo');
  revalidatePath('/psicologo/anuncios');
  revalidatePath('/estudiante');
  revalidatePath('/estudiante/anuncios');
  return { ok: true as const, push: pushResult };
}

export async function toggleAnnouncementAction(id: string) {
  await requireRole(['ADMIN', 'PSYCHOLOGIST']);
  await toggleAnnouncement(id);
  revalidatePath('/admin/anuncios');
  revalidatePath('/psicologo');
  revalidatePath('/psicologo/anuncios');
  revalidatePath('/estudiante');
  revalidatePath('/estudiante/anuncios');
}

export async function deleteAnnouncementAction(id: string) {
  await requireRole(['ADMIN', 'PSYCHOLOGIST']);
  await deleteAnnouncement(id);
  revalidatePath('/admin/anuncios');
  revalidatePath('/psicologo');
  revalidatePath('/psicologo/anuncios');
  revalidatePath('/estudiante');
  revalidatePath('/estudiante/anuncios');
}
