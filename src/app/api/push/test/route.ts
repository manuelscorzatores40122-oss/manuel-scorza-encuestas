import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sendPushToRoles } from '@/lib/push';

export async function POST() {
  const session = await getSession();
  if (!session || !['ADMIN', 'PSYCHOLOGIST', 'DIRECTOR'].includes(session.role)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  }

  const vapidConfigured = Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
  );

  if (!vapidConfigured) {
    return NextResponse.json({
      ok: false,
      error: 'VAPID keys no configuradas en el servidor. Agrega NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y VAPID_SUBJECT en las variables de entorno de Vercel.',
    });
  }

  const result = await sendPushToRoles(['STUDENT'], {
    title: '🔔 Prueba de notificación',
    body: 'Si ves esto, las notificaciones push funcionan correctamente.',
    url: '/estudiante/anuncios',
    tag: 'test-push',
    count: 0,
  });

  return NextResponse.json({ ok: true, ...result });
}
