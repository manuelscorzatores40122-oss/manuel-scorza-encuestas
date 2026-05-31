import { Megaphone, Calendar, ChevronDown } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { BtnInstalarApp } from '@/components/BtnInstalarApp';
import { BtnNotificaciones } from '@/components/BtnNotificaciones';
import styles from './anuncios.module.css';

export default async function AnunciosEstudiante() {
  const announcements = await prisma.announcement.findMany({
    where: {
      isPublished: true,
      OR: [
        { targetRoles: { has: 'STUDENT' } },
        { targetRoles: { isEmpty: true } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id:        true,
      title:     true,
      content:   true,
      createdAt: true,
      createdBy: { select: { fullName: true } },
    },
  });

  return (
    <div className={styles.page}>

      {/* Banner */}
      <div className={styles.banner}>
        <div className={styles.bannerIconWrap}>
          <Megaphone className={styles.bannerIconSvg} />
        </div>
        <div className={styles.bannerText}>
          <h1 className={styles.bannerTitle}>Anuncios</h1>
          <p className={styles.bannerSub}>
            {announcements.length > 0
              ? `${announcements.length} comunicado${announcements.length > 1 ? 's' : ''} publicado${announcements.length > 1 ? 's' : ''}`
              : 'Sin comunicados por ahora'}
          </p>
        </div>
      </div>

      {/* Sección */}
      <div className={styles.sectionRow}>
        <span className={styles.sectionTitle}>Comunicados recientes</span>
        <span className={styles.sectionCount}>
          {announcements.length} {announcements.length === 1 ? 'anuncio' : 'anuncios'}
        </span>
      </div>

      {/* Instalar app + notificaciones */}
      <BtnInstalarApp />
      <BtnNotificaciones />

      {/* Acordeón */}
      {announcements.length > 0 ? (
        <div className={styles.list}>
          {announcements.map((a) => {
            const initial = a.createdBy.fullName.charAt(0).toUpperCase();
            const fecha = new Date(a.createdAt).toLocaleDateString('es-PE', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <details
                key={a.id}
                className={styles.item}
              >
                {/* Cabecera / trigger */}
                <summary className={styles.itemSummary}>
                  <div className={styles.summaryLeft}>
                    <div className={styles.summaryIcon}>
                      <Megaphone className={styles.summaryIconSvg} />
                    </div>
                    <div className={styles.summaryText}>
                      <span className={styles.summaryTitle}>{a.title}</span>
                      <span className={styles.summaryMeta} suppressHydrationWarning>
                        <Calendar className={styles.summaryMetaIcon} />
                        {fecha}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={styles.summaryChevron} />
                </summary>

                {/* Contenido expandible */}
                <div className={styles.itemBody}>
                  <p className={styles.itemContent}>{a.content}</p>
                  <div className={styles.itemFooter}>
                    <div className={styles.itemAuthor}>
                      <div className={styles.authorAvatar}>{initial}</div>
                      <span className={styles.authorName}>{a.createdBy.fullName}</span>
                    </div>
                  </div>
                </div>

              </details>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIconWrap}>
            <Megaphone className={styles.emptyIconSvg} />
          </div>
          <p className={styles.emptyTitle}>Sin anuncios por ahora</p>
          <p className={styles.emptyDesc}>
            Cuando el colegio publique comunicados, aparecerán aquí.
          </p>
        </div>
      )}

    </div>
  );
}
