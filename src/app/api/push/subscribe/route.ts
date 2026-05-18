import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type PushSubscriptionBody = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
  }

  const body = (await request.json()) as PushSubscriptionBody;

  if (!body.endpoint || !body.keys?.p256dh || !body.keys.auth) {
    return NextResponse.json({ ok: false, error: 'Suscripción inválida' }, { status: 400 });
  }

  await prisma.$executeRaw`
    INSERT INTO "PushSubscription" (
      id, "userId", endpoint, p256dh, auth, "userAgent", "createdAt", "updatedAt"
    )
    VALUES (
      ${crypto.randomUUID()},
      ${session.userId},
      ${body.endpoint},
      ${body.keys.p256dh},
      ${body.keys.auth},
      ${request.headers.get('user-agent')},
      NOW(),
      NOW()
    )
    ON CONFLICT (endpoint)
    DO UPDATE SET
      "userId" = EXCLUDED."userId",
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth,
      "userAgent" = EXCLUDED."userAgent",
      "updatedAt" = NOW()
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as PushSubscriptionBody | null;

  if (!body?.endpoint) {
    return NextResponse.json({ ok: false, error: 'Endpoint requerido' }, { status: 400 });
  }

  await prisma.$executeRaw`
    DELETE FROM "PushSubscription"
    WHERE "userId" = ${session.userId}
      AND endpoint = ${body.endpoint}
  `;

  return NextResponse.json({ ok: true });
}
