'use server';

import { revalidatePath } from 'next/cache';
import type { Role } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAnnouncement, deleteAnnouncement, toggleAnnouncement } from '@/lib/announcements';
import { sendAnnouncementPush } from '@/lib/push';

const ALLOWED: Role[] = ['ADMIN', 'PSYCHOLOGIST', 'DIRECTOR'];

function invalidate() {
  revalidatePath('/director/anuncios');
  revalidatePath('/admin/anuncios');
  revalidatePath('/psicologo/anuncios');
  revalidatePath('/estudiante');
  revalidatePath('/estudiante/anuncios');
}

export async function createAnnouncementAction(formData: FormData) {
  const session = await requireRole(ALLOWED);
  const title   = String(formData.get('title')   || '').trim();
  const content = String(formData.get('content') || '').trim();
  const targetRoles = formData.getAll('targetRoles').map(String);

  if (!title || !content) {
    return { ok: false as const, error: 'Completa el título y el mensaje.' };
  }

  const announcementId = crypto.randomUUID();
  const roles = (targetRoles.length > 0 ? targetRoles : ['STUDENT']) as Role[];

  await createAnnouncement({ id: announcementId, title, content, targetRoles: roles, createdById: session.userId });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: 'CREATE_ANNOUNCEMENT',
      entity: 'Announcement',
      entityId: announcementId,
      metadata: { title, targetRoles: roles } as object,
    },
  });

  const pushResult = await sendAnnouncementPush({ title, content, targetRoles: roles });
  invalidate();
  return { ok: true as const, push: pushResult };
}

export async function toggleAnnouncementAction(id: string) {
  await requireRole(ALLOWED);
  await toggleAnnouncement(id);
  invalidate();
}

export async function deleteAnnouncementAction(id: string) {
  await requireRole(ALLOWED);
  await deleteAnnouncement(id);
  invalidate();
}
