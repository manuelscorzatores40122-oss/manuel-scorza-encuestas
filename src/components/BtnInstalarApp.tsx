'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import styles from './BtnInstalarApp.module.css';

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function pedirNotificaciones() {
  if (!VAPID_KEY || !('Notification' in window) || !('PushManager' in window)) return;
  if (Notification.permission === 'granted') return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
    });

    await fetch('/api/push/subscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(sub),
    });
  } catch (err) {
    console.warn('[Push tras instalación]', err);
  }
}

export function BtnInstalarApp() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      // Pequeña pausa para que la app se registre antes de pedir permisos
      setTimeout(pedirNotificaciones, 1500);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function instalar() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setTimeout(pedirNotificaciones, 2000);
    }
    setPrompt(null);
  }

  if (installed || !prompt) return null;

  return (
    <button onClick={instalar} className={styles.btn}>
      <div className={styles.iconWrap}>
        <Download className={styles.icon} />
      </div>
      <div className={styles.text}>
        <span className={styles.label}>Instalar PsicoEscolar</span>
        <span className={styles.sub}>Accede más rápido desde tu móvil</span>
      </div>
    </button>
  );
}
