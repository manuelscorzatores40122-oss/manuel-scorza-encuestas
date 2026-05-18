'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index++) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function getRegistration() {
  if (!('serviceWorker' in navigator)) return null;

  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;

  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

async function saveSubscription(subscription: PushSubscription) {
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscription),
  });

  if (!response.ok) {
    throw new Error('No se pudo guardar la suscripción');
  }
}

export function PushSubscriptionButton({ className }: { className?: string }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;

    async function checkSupport() {
      const canUsePush =
        Boolean(vapidPublicKey) &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        'PushManager' in window &&
        'serviceWorker' in navigator;

      if (!canUsePush) return;

      const registration = await getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (mounted) {
        setSupported(true);
        setEnabled(Boolean(subscription));
      }
    }

    checkSupport().catch(() => {
      if (mounted) setSupported(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!supported) return null;

  function subscribe() {
    startTransition(async () => {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted' || !vapidPublicKey) return;

      const registration = await getRegistration();
      if (!registration) return;

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));

      await saveSubscription(subscription);
      setEnabled(true);
    });
  }

  return (
    <button
      type="button"
      onClick={subscribe}
      disabled={pending || enabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors',
        enabled
          ? 'bg-white/10 text-white/70'
          : 'bg-white/10 text-white/90 hover:bg-white/15 hover:text-white',
        className
      )}
    >
      {enabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
      {enabled ? 'Notificaciones activas' : pending ? 'Activando...' : 'Activar notificaciones'}
    </button>
  );
}
