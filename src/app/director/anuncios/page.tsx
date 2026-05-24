import { listAnnouncements } from '@/lib/announcements';
import { DatabaseUnavailable } from '@/components/BaseDatosNoDisponible';
import { GestorAnunciosDirector } from './GestorAnunciosDirector';
import styles from './anuncios.module.css';

export default async function AnunciosDirector() {
  try {
    const raw = await listAnnouncements(50);
    const announcements = raw.map(a => ({
      id:          a.id,
      title:       a.title,
      content:     a.content,
      isPublished: a.isPublished,
      createdAt:   a.createdAt.toISOString(),
      createdBy:   a.createdBy,
    }));

    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.kick}>Panel · Director</div>
          <h1 className={styles.pageTitle}>Anuncios para alumnos</h1>
          <p className={styles.pageSub}>
            Publica comunicados breves que aparecerán en el panel de inicio de los estudiantes.
          </p>
        </header>
        <GestorAnunciosDirector announcements={announcements} />
      </div>
    );
  } catch {
    return <DatabaseUnavailable />;
  }
}
