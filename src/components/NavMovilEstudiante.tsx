'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Megaphone, History, UserRound } from 'lucide-react';
import styles from '@/app/estudiante/layout.module.css';

const NAV = [
  { href: '/estudiante',           label: 'Inicio',    icon: Home,          badge: false },
  { href: '/estudiante/encuestas', label: 'Encuestas', icon: ClipboardList, badge: true  },
  { href: '/estudiante/anuncios',  label: 'Anuncios',  icon: Megaphone,     badge: false },
  { href: '/estudiante/historial', label: 'Historial', icon: History,       badge: false },
  { href: '/estudiante/perfil',    label: 'Perfil',    icon: UserRound,     badge: false },
];

export function StudentMobileBottomNav({ pendingSurveys }: { pendingSurveys: number }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/estudiante') return pathname === '/estudiante';
    return pathname.startsWith(href);
  }

  return (
    <nav className={styles.mobileBottomNav}>
      {NAV.map(({ href, label, icon: Icon, badge }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.mobileNavButton} ${active ? styles.mobileNavButtonActive : ''}`}
          >
            <span className={styles.mobileNavIconWrap}>
              <Icon className={styles.mobileIcon} />
              {badge && pendingSurveys > 0 && (
                <span className={styles.mobileBadge}>
                  {pendingSurveys > 9 ? '9+' : pendingSurveys}
                </span>
              )}
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
