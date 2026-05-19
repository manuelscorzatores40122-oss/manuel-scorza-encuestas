'use server';

import { requireSession, hashPassword, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function changePasswordAction(formData: FormData) {
  const session = await requireSession();

  const current = formData.get('current') as string;
  const next = formData.get('next') as string;
  const confirm = formData.get('confirm') as string;

  if (!current || !next || !confirm)
    return { ok: false as const, error: 'Completa todos los campos.' };

  if (next.length < 6)
    return { ok: false as const, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };

  if (next !== confirm)
    return { ok: false as const, error: 'Las contraseñas nuevas no coinciden.' };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { ok: false as const, error: 'Usuario no encontrado.' };

  const valid = await verifyPassword(current, user.passwordHash);
  if (!valid) return { ok: false as const, error: 'La contraseña actual es incorrecta.' };

  const passwordHash = await hashPassword(next);
  await prisma.user.update({ where: { id: session.userId }, data: { passwordHash } });

  return { ok: true as const };
}
