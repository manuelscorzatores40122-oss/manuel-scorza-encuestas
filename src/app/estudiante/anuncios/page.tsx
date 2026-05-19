import { Megaphone, Calendar } from 'lucide-react';
import { listPublishedAnnouncementsFor } from '@/lib/announcements';
import styles from './anuncios.module.css';

export default async function AnunciosEstudiante() {
  const announcements = await listPublishedAnnouncementsFor('STUDENT', 100);

  return (
    <div className={styles.page}>

      {/* Banner superior */}
      <div className={styles.banner}>
        <div className={styles.bannerIcon}>
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
        {announcements.length > 0 && (
          <span className={styles.bannerBadge}>{announcements.length}</span>
        )}
      </div>

      {/* Lista de anuncios */}
      {announcements.length > 0 ? (
        <div className={styles.list}>
          {announcements.map((a) => (
            <article key={a.id} className={styles.card}>

              <div className={styles.cardHead}>
                <div className={styles.cardTitleRow}>
                  <div className={styles.cardIconWrap}>
                    <Megaphone className={styles.cardIcon} />
                  </div>
                  <h2 className={styles.cardTitle}>{a.title}</h2>
                </div>
                <span className={styles.cardDate} suppressHydrationWarning>
                  <Calendar className={styles.cardDateIcon} />
                  {new Date(a.createdAt).toLocaleDateString('es-PE', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardDivider} />
                <p className={styles.cardContent}>{a.content}</p>
              </div>

            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📢</span>
          <p className={styles.emptyTitle}>Sin anuncios por ahora</p>
          <p className={styles.emptyDesc}>
            Cuando el colegio publique comunicados, aparecerán aquí.
          </p>
        </div>
      )}

    </div>
  );
}
