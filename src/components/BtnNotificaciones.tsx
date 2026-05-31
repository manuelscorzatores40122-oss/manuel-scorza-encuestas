'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import styles from './BtnNotificaciones.module.css';

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function getRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;
  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

type Estado = 'idle' | 'activo' | 'no-soportado';

export function BtnNotificaciones() {
  const [estado, setEstado] = useState<Estado>('idle');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!VAPID_KEY || !('Notification' in window) || !('PushManager' in window)) {
      setEstado('no-soportado');
      return;
    }

    (async () => {
      const reg = await getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) setEstado('activo');
    })();
  }, []);

  function activar() {
    startTransition(async () => {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted' || !VAPID_KEY) return;

      const reg = await getRegistration();
      if (!reg) return;

      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });

      setEstado('activo');
    });
  }

  if (estado === 'no-soportado') return null;

  return (
    <div className={styles.card}>
      <div className={styles.cardLeft}>
        <div className={styles.iconWrap}>
          {estado === 'activo'
            ? <Bell className={styles.icon} />
            : <BellOff className={styles.icon} />}
        </div>
        <div className={styles.text}>
          <span className={styles.label}>
            {estado === 'activo' ? 'Notificaciones activas' : 'Recibe notificaciones'}
          </span>
          <span className={styles.sub}>
            {estado === 'activo'
              ? 'Te avisaremos de encuestas y anuncios'
              : 'Entérate de encuestas y anuncios nuevos'}
          </span>
        </div>
      </div>

      {estado === 'activo' ? (
        <span className={styles.badge}>
          <Check className={styles.badgeIcon} />
          Activo
        </span>
      ) : (
        <button
          onClick={activar}
          disabled={pending}
          className={styles.btn}
        >
          {pending ? 'Activando...' : 'Activar'}
        </button>
      )}
    </div>
  );
}
