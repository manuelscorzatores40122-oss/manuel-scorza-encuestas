import { Megaphone } from 'lucide-react';
import { listAnnouncements } from '@/lib/announcements';
import { GestorAnuncios } from '@/app/admin/anuncios/GestorAnuncios';
import styles from './anuncios.module.css';

export default async function PsicologoAnunciosPage() {
  const announcements = await listAnnouncements(50);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>
          <Megaphone className={styles.headingIcon} /> Anuncios para alumnos
        </h1>
        <p className={styles.sub}>
          Publica comunicados breves que aparecerán en el panel de los estudiantes.
        </p>
      </header>

      <GestorAnuncios
        announcements={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          targetRoles: a.targetRoles,
          isPublished: a.isPublished,
          createdAt: a.createdAt.toISOString(),
          createdBy: a.createdBy,
        }))}
      />
    </div>
  );
}
