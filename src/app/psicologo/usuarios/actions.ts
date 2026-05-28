'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';

function generateTempPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function createPsychologistAction(formData: FormData) {
  const session = await requireRole(['PSYCHOLOGIST', 'ADMIN']);
  const fullName = (formData.get('fullName') as string)?.trim();
  const username = (formData.get('username') as string)?.trim().toLowerCase();

  if (!fullName || !username) return { ok: false as const, error: 'Faltan datos' };

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return { ok: false as const, error: 'Ya existe un usuario con ese correo' };

  const tempPassword = generateTempPassword();
  await prisma.user.create({
    data: {
      username,
      role: 'PSYCHOLOGIST',
      fullName,
      email: username.includes('@') ? username : null,
      passwordHash: await hashPassword(tempPassword),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: 'CREATE_USER',
      entity: 'User',
      metadata: { username, role: 'PSYCHOLOGIST' } as any,
    },
  });

  revalidatePath('/psicologo/usuarios');
  return { ok: true as const, tempPassword };
}

export async function resetPsychologistPasswordAction(userId: string) {
  await requireRole(['PSYCHOLOGIST', 'ADMIN']);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'PSYCHOLOGIST') return { ok: false as const, error: 'Usuario no encontrado' };

  const tempPassword = generateTempPassword();
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(tempPassword) },
  });

  return { ok: true as const, tempPassword };
}

export async function deactivatePsychologistAction(userId: string) {
  const session = await requireRole(['PSYCHOLOGIST', 'ADMIN']);
  await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  await prisma.auditLog.create({
    data: { userId: session.userId, action: 'DEACTIVATE_USER', entity: 'User', entityId: userId },
  });
  revalidatePath('/psicologo/usuarios');
  return { ok: true as const };
}

export async function activatePsychologistAction(userId: string) {
  const session = await requireRole(['PSYCHOLOGIST', 'ADMIN']);
  await prisma.user.update({ where: { id: userId }, data: { isActive: true } });
  await prisma.auditLog.create({
    data: { userId: session.userId, action: 'ACTIVATE_USER', entity: 'User', entityId: userId },
  });
  revalidatePath('/psicologo/usuarios');
  return { ok: true as const };
}
