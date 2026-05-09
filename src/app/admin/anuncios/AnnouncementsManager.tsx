'use client';

import { useState, useTransition } from 'react';
import { Megaphone, Send, EyeOff, Eye, Trash2 } from 'lucide-react';
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  toggleAnnouncementAction,
} from './actions';

type Announcement = {
  id: string;
  title: string;
  content: string;
  targetRoles: string[];
  isPublished: boolean;
  createdAt: string;
  createdBy: { fullName: string };
};

export function AnnouncementsManager({ announcements }: { announcements: Announcement[] }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function create(formData: FormData) {
    setMsg(null);
    startTransition(async () => {
      const result = await createAnnouncementAction(formData);
      if (result.ok) {
        setMsg('Anuncio publicado correctamente.');
        const form = document.getElementById('announcement-form') as HTMLFormElement | null;
        form?.reset();
      } else {
        setMsg(result.error);
      }
    });
  }

  function toggle(id: string) {
    startTransition(async () => {
      await toggleAnnouncementAction(id);
    });
  }

  function remove(id: string) {
    if (!confirm('¿Eliminar este anuncio?')) return;
    startTransition(async () => {
      await deleteAnnouncementAction(id);
    });
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <form id="announcement-form" action={create} className="card lg:col-span-1 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-brand-600" /> Nuevo anuncio
        </h2>

        <div>
          <label className="label">Título</label>
          <input name="title" className="input" required maxLength={120} placeholder="Ej. Reunión de padres" />
        </div>

        <div>
          <label className="label">Mensaje</label>
          <textarea
            name="content"
            className="input min-h-[150px] resize-none"
            required
            maxLength={1200}
            placeholder="Escribe el comunicado que verán los estudiantes..."
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="label">Destinatarios</legend>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="targetRoles" value="STUDENT" defaultChecked />
            Estudiantes
          </label>
          <p className="text-xs text-slate-500">
            Por ahora los anuncios se muestran en el panel del estudiante.
          </p>
        </fieldset>

        {msg && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-800">
            {msg}
          </div>
        )}

        <button className="btn-primary w-full" disabled={pending}>
          <Send className="w-4 h-4" /> {pending ? 'Publicando...' : 'Publicar anuncio'}
        </button>
      </form>

      <section className="lg:col-span-2 space-y-3">
        {announcements.map((a) => (
          <article key={a.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{a.title}</h3>
                  <span className={a.isPublished ? 'badge bg-emerald-100 text-emerald-700' : 'badge bg-slate-100 text-slate-600'}>
                    {a.isPublished ? 'Publicado' : 'Oculto'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(a.createdAt).toLocaleString('es-PE')} · {a.createdBy.fullName}
                </p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => toggle(a.id)} className="btn-secondary !px-3 !py-2" disabled={pending}>
                  {a.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => remove(a.id)} className="btn-danger !px-3 !py-2" disabled={pending}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="mt-4 whitespace-pre-line text-sm text-slate-700">{a.content}</p>
          </article>
        ))}

        {announcements.length === 0 && (
          <div className="card text-center text-slate-500">
            Todavía no hay anuncios publicados.
          </div>
        )}
      </section>
    </div>
  );
}
