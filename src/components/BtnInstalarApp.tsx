'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import styles from './BtnInstalarApp.module.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
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

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function instalar() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
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
