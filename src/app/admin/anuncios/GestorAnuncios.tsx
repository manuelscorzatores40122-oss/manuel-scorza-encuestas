'use client';

import { useState, useTransition } from 'react';
import { Megaphone, Send, EyeOff, Eye, Trash2 } from 'lucide-react';
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  toggleAnnouncementAction,
} from './actions';
import styles from './GestorAnuncios.module.css';

type Announcement = {
  id: string;
  title: string;
  content: string;
  targetRoles: string[];
  isPublished: boolean;
  createdAt: string;
  createdBy: { fullName: string };
};

export function GestorAnuncios({ announcements }: { announcements: Announcement[] }) {
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
    <div className={styles.grid}>
      {/* ── Formulario ── */}
      <form id="announcement-form" action={create} className={styles.form}>
        <h2 className={styles.formHeading}>
          <Megaphone className={styles.formIcon} /> Nuevo anuncio
        </h2>

        <div className={styles.field}>
          <label className={styles.label}>Título</label>
          <input
            name="title"
            className={styles.input}
            required
            maxLength={120}
            placeholder="Ej. Reunión de padres"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Mensaje</label>
          <textarea
            name="content"
            className={styles.textarea}
            required
            maxLength={1200}
            placeholder="Escribe el comunicado que verán los estudiantes..."
          />
        </div>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Destinatarios</legend>
          <label className={styles.checkLabel}>
            <input type="checkbox" name="targetRoles" value="STUDENT" defaultChecked />
            Estudiantes
          </label>
          <p className={styles.hint}>
            Por ahora los anuncios se muestran en el panel del estudiante.
          </p>
        </fieldset>

        {msg && <div className={styles.msg}>{msg}</div>}

        <button className={styles.btnPublish} disabled={pending}>
          <Send className={styles.btnIcon} />
          {pending ? 'Publicando…' : 'Publicar anuncio'}
        </button>
      </form>

      {/* ── Lista ── */}
      <section className={styles.list}>
        {announcements.map((a) => (
          <article key={a.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.cardMeta}>
                <div className={styles.cardTitleRow}>
                  <h3 className={styles.cardTitle}>{a.title}</h3>
                  <span className={a.isPublished ? styles.badgePublished : styles.badgeHidden}>
                    {a.isPublished ? 'Publicado' : 'Oculto'}
                  </span>
                </div>
                <p className={styles.cardDate} suppressHydrationWarning>
                  {new Date(a.createdAt).toLocaleString('es-PE')} · {a.createdBy.fullName}
                </p>
              </div>

              <div className={styles.cardActions}>
                <button
                  onClick={() => toggle(a.id)}
                  className={styles.btnAction}
                  disabled={pending}
                  title={a.isPublished ? 'Ocultar' : 'Publicar'}
                >
                  {a.isPublished
                    ? <EyeOff className={styles.actionIcon} />
                    : <Eye className={styles.actionIcon} />}
                </button>
                <button
                  onClick={() => remove(a.id)}
                  className={styles.btnActionDanger}
                  disabled={pending}
                  title="Eliminar"
                >
                  <Trash2 className={styles.actionIcon} />
                </button>
              </div>
            </div>

            <p className={styles.cardContent}>{a.content}</p>
          </article>
        ))}

        {announcements.length === 0 && (
          <div className={styles.empty}>
            Todavía no hay anuncios publicados.
          </div>
        )}
      </section>
    </div>
  );
}
