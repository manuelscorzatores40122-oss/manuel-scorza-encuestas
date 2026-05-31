'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Megaphone, History, UserRound } from 'lucide-react';
import styles from '@/app/estudiante/layout.module.css';

const NAV = [
  { href: '/estudiante',           label: 'Inicio',    icon: Home,          badgeKey: 'none'          },
  { href: '/estudiante/encuestas', label: 'Encuestas', icon: ClipboardList, badgeKey: 'surveys'       },
  { href: '/estudiante/anuncios',  label: 'Anuncios',  icon: Megaphone,     badgeKey: 'announcements' },
  { href: '/estudiante/historial', label: 'Historial', icon: History,       badgeKey: 'none'          },
  { href: '/estudiante/perfil',    label: 'Perfil',    icon: UserRound,     badgeKey: 'none'          },
];

export function StudentMobileBottomNav({
  pendingSurveys,
  announcementsCount,
}: {
  pendingSurveys:    number;
  announcementsCount: number;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/estudiante') return pathname === '/estudiante';
    return pathname.startsWith(href);
  }

  function badgeCount(key: string) {
    if (key === 'surveys')       return pendingSurveys;
    if (key === 'announcements') return announcementsCount;
    return 0;
  }

  return (
    <nav className={styles.mobileBottomNav}>
      {NAV.map(({ href, label, icon: Icon, badgeKey }) => {
        const active = isActive(href);
        const count  = badgeCount(badgeKey);
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.mobileNavButton} ${active ? styles.mobileNavButtonActive : ''}`}
          >
            <span className={styles.mobileNavIconWrap}>
              <Icon className={styles.mobileIcon} />
              {count > 0 && (
                <span className={styles.mobileBadge}>
                  {count > 9 ? '9+' : count}
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
