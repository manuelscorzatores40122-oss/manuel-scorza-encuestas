import { Megaphone } from 'lucide-react';
import { listAnnouncements } from '@/lib/announcements';
import { AnnouncementsManager } from './AnnouncementsManager';

export default async function AdminAnunciosPage() {
  const announcements = await listAnnouncements(50);

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-brand-600" /> Anuncios
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Publica comunicados breves para que los estudiantes los vean al iniciar sesión.
        </p>
      </header>

      <AnnouncementsManager
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
