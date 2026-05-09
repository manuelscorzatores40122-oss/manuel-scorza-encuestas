'use server';

import { authenticate, createSession, dashboardPathFor, destroySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function loginAction(input: { username: string; password: string }) {
  const { username, password } = input;
  if (!username || !password) {
    return { ok: false as const, error: 'Completa ambos campos' };
  }

  const user = await authenticate(username, password);
  if (!user) {
    return { ok: false as const, error: 'Usuario o contraseña incorrectos' };
  }

  await createSession({
    userId: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id },
  });

  return { ok: true as const, redirectTo: dashboardPathFor(user.role) };
}

export async function logoutAction() {
  await destroySession();
  return { ok: true as const };
}
