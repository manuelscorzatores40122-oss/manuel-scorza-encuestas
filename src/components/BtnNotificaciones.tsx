'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bell, BellOff, Check, Smartphone } from 'lucide-react';
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

function esIOSNoInstalado() {
  const ua = navigator.userAgent;
  const esIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const instalado = (navigator as any).standalone === true;
  return esIOS && !instalado;
}

async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  // Esperar SW activo (máx 4s)
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing?.active) return existing;

  const reg = await navigator.serviceWorker.register('/sw.js', {
    scope: '/',
    updateViaCache: 'none',
  });

  if (reg.active) return reg;

  return new Promise((resolve) => {
    const sw = reg.installing ?? reg.waiting ?? null;
    if (!sw) { resolve(reg); return; }
    sw.addEventListener('statechange', () => {
      if (sw.state === 'activated') resolve(reg);
    });
    setTimeout(() => resolve(reg), 4000);
  });
}

type Estado = 'cargando' | 'idle' | 'activo' | 'ios-pwa' | 'no-soportado';

export function BtnNotificaciones() {
  const [estado, setEstado] = useState<Estado>('cargando');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      !VAPID_KEY ||
      !('Notification'    in window) ||
      !('PushManager'     in window) ||
      !('serviceWorker'   in navigator)
    ) {
      if (esIOSNoInstalado()) setEstado('ios-pwa');
      else setEstado('no-soportado');
      return;
    }

    if (esIOSNoInstalado()) {
      setEstado('ios-pwa');
      return;
    }

    (async () => {
      try {
        const reg = await getSWRegistration();
        const sub = await reg?.pushManager.getSubscription();
        setEstado(sub ? 'activo' : 'idle');
      } catch {
        setEstado('idle');
      }
    })();
  }, []);

  function activar() {
    setError(null);
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setError('Activa los permisos de notificación en tu navegador.');
          return;
        }
        if (!VAPID_KEY) return;

        const reg = await getSWRegistration();
        if (!reg) { setError('El Service Worker no está disponible.'); return; }

        const existing = await reg.pushManager.getSubscription();
        const sub = existing ?? await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
        });

        const res = await fetch('/api/push/subscribe', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(sub),
        });

        if (!res.ok) throw new Error('Error al guardar suscripción');
        setEstado('activo');
      } catch (err) {
        setError('No se pudo activar. Inténtalo de nuevo.');
        console.error('[Push]', err);
      }
    });
  }

  if (estado === 'cargando' || estado === 'no-soportado') return null;

  if (estado === 'ios-pwa') {
    return (
      <div className={styles.card}>
        <div className={styles.cardLeft}>
          <div className={styles.iconWrap}>
            <Smartphone className={styles.icon} />
          </div>
          <div className={styles.text}>
            <span className={styles.label}>Instala la app primero</span>
            <span className={styles.sub}>
              En iPhone: Safari → Compartir → Añadir a inicio para recibir notificaciones
            </span>
          </div>
        </div>
      </div>
    );
  }

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
              : error ?? 'Entérate de encuestas y anuncios nuevos'}
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
          className={`${styles.btn} ${error ? styles.btnError : ''}`}
        >
          {pending ? 'Activando...' : error ? 'Reintentar' : 'Activar'}
        </button>
      )}
    </div>
  );
}
