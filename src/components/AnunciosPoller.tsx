'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Megaphone, X } from 'lucide-react';
import styles from './AnunciosPoller.module.css';

const INTERVAL = 30_000; // 30 segundos

type BannerData = { title: string };

export function AnunciosPoller({ initialCount }: { initialCount: number }) {
  const router        = useRouter();
  const knownCount    = useRef(initialCount);
  const [banner, setBanner] = useState<BannerData | null>(null);
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  function dismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setBanner(null);
  }

  useEffect(() => {
    knownCount.current = initialCount;
  }, [initialCount]);

  useEffect(() => {
    const controller = new AbortController();

    async function poll() {
      try {
        const res = await fetch('/api/announcements/latest', { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) return;
        const data: { count: number; title: string | null } = await res.json();

        if (data.count > knownCount.current) {
          knownCount.current = data.count;

          // Vibrar el teléfono
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);

          // Mostrar banner
          if (timerRef.current) clearTimeout(timerRef.current);
          setBanner({ title: data.title ?? 'Nuevo anuncio publicado' });
          timerRef.current = setTimeout(dismiss, 6000);

          // Refrescar datos del layout (contadores nav)
          router.refresh();
        }
      } catch {
        // network error o abortado — ignorar silenciosamente
      }
    }

    const id = setInterval(poll, INTERVAL);
    return () => {
      clearInterval(id);
      controller.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [router]);

  if (!banner) return null;

  return (
    <div className={styles.banner} role="alert" aria-live="polite">
      <div className={styles.iconWrap}>
        <Megaphone className={styles.icon} />
      </div>
      <div className={styles.text}>
        <span className={styles.label}>Nuevo anuncio</span>
        <span className={styles.body}>{banner.title}</span>
      </div>
      <a href="/estudiante/anuncios" className={styles.ver} onClick={dismiss}>Ver</a>
      <button className={styles.close} onClick={dismiss} aria-label="Cerrar">
        <X className={styles.closeIcon} />
      </button>
    </div>
  );
}
