'use server';

import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';

function generateTempPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function createUserAction(formData: FormData) {
  const session = await requireRole(['ADMIN']);
  const fullName = (formData.get('fullName') as string)?.trim();
  const username = (formData.get('username') as string)?.trim().toLowerCase();
  const role = formData.get('role') as Role;

  if (!fullName || !username || !role) return { ok: false as const, error: 'Faltan datos' };
  if (role === 'STUDENT') return { ok: false as const, error: 'Los estudiantes se importan desde SIAGIE' };

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return { ok: false as const, error: 'Ya existe un usuario con ese correo' };

  const tempPassword = generateTempPassword();
  await prisma.user.create({
    data: {
      username, role, fullName,
      email: username.includes('@') ? username : null,
      passwordHash: await hashPassword(tempPassword),
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: 'CREATE_USER', entity: 'User', metadata: { username, role } as any },
  });

  revalidatePath('/admin/usuarios');
  return { ok: true as const, tempPassword };
}

export async function resetPasswordAction(userId: string) {
  const session = await requireRole(['ADMIN']);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false as const, error: 'Usuario no encontrado' };

  const tempPassword = user.role === 'STUDENT' ? user.username.slice(-6) : generateTempPassword();
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(tempPassword) },
  });

  await prisma.auditLog.create({
    data: { userId: session.userId, action: 'RESET_PASSWORD', entity: 'User', entityId: userId },
  });

  return { ok: true as const, tempPassword };
}

export async function deactivateUserAction(userId: string) {
  const session = await requireRole(['ADMIN']);
  await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  await prisma.auditLog.create({
    data: { userId: session.userId, action: 'DEACTIVATE_USER', entity: 'User', entityId: userId },
  });
  revalidatePath('/admin/usuarios');
  return { ok: true as const };
}
