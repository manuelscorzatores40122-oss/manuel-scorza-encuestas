import { listAnnouncements } from '@/lib/announcements';
import { DatabaseUnavailable } from '@/components/BaseDatosNoDisponible';
import { GestorAnunciosPsi } from './GestorAnunciosPsi';
import styles from './anuncios.module.css';

export default async function AnunciosPsicologo() {
  try {
    const raw = await listAnnouncements(50);
    const announcements = raw.map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      isPublished: a.isPublished,
      createdAt: a.createdAt.toISOString(),
      createdBy: a.createdBy,
    }));

    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.kick}>Comunicación</div>
          <h1 className={styles.pageTitle}>Anuncios para alumnos</h1>
          <p className={styles.pageSub}>
            Publica comunicados breves que aparecerán en el panel de inicio de los estudiantes.
          </p>
        </header>
        <GestorAnunciosPsi announcements={announcements} />
      </div>
    );
  } catch {
    return <DatabaseUnavailable />;
  }
}
