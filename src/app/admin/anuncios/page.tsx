import { listAnnouncements } from '@/lib/announcements';
import { GestorAnuncios } from './GestorAnuncios';

export default async function AdminAnunciosPage() {
  const announcements = await listAnnouncements(50);

  return (
    <div style={{ fontSize: 15, color: '#1a1a18' }}>

      {/* ── Encabezado ── */}
      <header style={{ paddingBottom: 18, borderBottom: '2px solid #1a1a18' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8a887f', margin: '0 0 10px' }}>
          Panel · Administrador
        </p>
        <h1 style={{ fontFamily: "var(--font-fraunces,'Fraunces',Georgia,serif)", fontSize: 34, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.02, margin: 0, color: '#1a1a18' }}>
          Anuncios
        </h1>
      </header>
      <div style={{ height: 4, width: 64, background: '#1a1a18', margin: '0 0 36px' }} />

      <GestorAnuncios
        announcements={announcements.map((a) => ({
          id:          a.id,
          title:       a.title,
          content:     a.content,
          targetRoles: a.targetRoles,
          isPublished: a.isPublished,
          createdAt:   a.createdAt.toISOString(),
          createdBy:   a.createdBy,
        }))}
      />
    </div>
  );
}
