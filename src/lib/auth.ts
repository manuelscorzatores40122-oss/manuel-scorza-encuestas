import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { Role } from '@prisma/client';
import { prisma } from './prisma';
import { verifyPassword as comparePassword } from './password';

export { hashPassword, verifyPassword } from './password';

const COOKIE_NAME = 'pse_session';
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars-please'
);

export type SessionPayload = {
  userId: string;
  username: string;
  role: Role;
  fullName: string;
};

export async function authenticate(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user || !user.isActive) return null;

  const ok = await comparePassword(
    password,
    user.passwordHash
  );

  if (!ok) return null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLogin: new Date(),
    },
  });

  return user;
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  cookies().delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}

export async function requireRole(allowed: Role[]): Promise<SessionPayload> {
  const session = await requireSession();
  if (!allowed.includes(session.role)) throw new Error('FORBIDDEN');
  return session;
}

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: 'Estudiante',
  TUTOR: 'Tutor',
  AUXILIAR: 'Auxiliar',
  PSYCHOLOGIST: 'Psicólogo',
  DIRECTOR: 'Director',
  ADMIN: 'Administrador',
};

export function dashboardPathFor(role: Role): string {
  switch (role) {
    case 'STUDENT': return '/estudiante';
    case 'PSYCHOLOGIST': return '/psicologo';
    case 'TUTOR': return '/tutor';
    case 'AUXILIAR': return '/auxiliar';
    case 'DIRECTOR': return '/director';
    case 'ADMIN': return '/admin';
  }
}
