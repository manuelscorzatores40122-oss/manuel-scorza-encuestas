import { Megaphone } from 'lucide-react';
import { listPublishedAnnouncementsFor } from '@/lib/announcements';

export default async function StudentAnnouncementsPage() {
  const announcements = await listPublishedAnnouncementsFor('STUDENT', 100);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-warm-600" /> Anuncios
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Comunicados publicados por el colegio para estudiantes.
        </p>
      </header>

      <div className="space-y-3">
        {announcements.map((announcement) => (
          <article key={announcement.id} className="card border-warm-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">{announcement.title}</h2>
              <span className="text-xs text-slate-500">
                {announcement.createdAt.toLocaleDateString('es-PE')}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-700 whitespace-pre-line">
              {announcement.content}
            </p>
          </article>
        ))}

        {announcements.length === 0 && (
          <div className="card text-center py-10">
            <p className="font-medium text-slate-700">No hay anuncios publicados.</p>
            <p className="text-sm text-slate-500 mt-1">Cuando el colegio publique comunicados, aparecerán aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
}
