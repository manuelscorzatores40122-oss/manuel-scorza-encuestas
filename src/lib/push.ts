import type { Role } from '@prisma/client';
import { prisma } from './prisma';

type PushPayload = {
  title: string;
  body:  string;
  url?:  string;
  tag?:  string;
  count?: number;
};

type WebPushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

let configured = false;

function hasPushConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  );
}

async function getWebPush() {
  if (!hasPushConfig()) return null;

  const webPush = await import('web-push');
  const push = webPush.default ?? webPush;

  if (!configured) {
    push.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    configured = true;
  }

  return push;
}

export async function sendPushToRoles(roles: Role[], payload: PushPayload) {
  const push = await getWebPush();
  if (!push || roles.length === 0) return { sent: 0, failed: 0, skipped: true };

  const subscriptions = await prisma.$queryRaw<PushSubscriptionRow[]>`
    SELECT
      ps.id,
      ps.endpoint,
      ps.p256dh,
      ps.auth
    FROM "PushSubscription" ps
    INNER JOIN "User" u ON u.id = ps."userId"
    WHERE u."isActive" = true
      AND u.role::text = ANY(${roles}::text[])
  `;

  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const pushSubscription: WebPushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      try {
        await push.sendNotification(pushSubscription, JSON.stringify(payload));
        sent++;
      } catch (error) {
        failed++;
        const statusCode = (error as { statusCode?: number }).statusCode;

        if (statusCode === 404 || statusCode === 410) {
          await prisma.$executeRaw`
            DELETE FROM "PushSubscription"
            WHERE id = ${subscription.id}
          `;
        } else {
          console.error('Error enviando push:', error);
        }
      }
    })
  );

  return { sent, failed, skipped: false };
}

export async function sendAnnouncementPush(input: {
  title:       string;
  content:     string;
  targetRoles: Role[];
}) {
  const body = input.content.length > 150
    ? input.content.slice(0, 147) + '…'
    : input.content;

  return sendPushToRoles(input.targetRoles, {
    title: `📢 ${input.title}`,
    body,
    url:   '/estudiante/anuncios',
    tag:   'anuncio',
    count: 1,
  });
}

export async function sendSurveyPush(input: {
  title: string;
}) {
  return sendPushToRoles(['STUDENT'], {
    title: '📋 Nueva encuesta disponible',
    body:  input.title,
    url:   '/estudiante/encuestas',
    tag:   'encuesta',
    count: 1,
  });
}

export async function sendRiskAlertPush(input: {
  riskLevel: string;
  riskScore: number;
}) {
  return sendPushToRoles(['PSYCHOLOGIST'], {
    title: '🚨 Alerta PsicoEscolar',
    body:  `Riesgo ${input.riskLevel} detectado (score ${input.riskScore})`,
    url:   '/psicologo/alertas',
    tag:   'alerta',
    count: 1,
  });
}
