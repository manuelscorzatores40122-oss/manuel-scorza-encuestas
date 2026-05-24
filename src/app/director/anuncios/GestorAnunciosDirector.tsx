'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Eye, EyeOff, Trash2, Check, ChevronDown } from 'lucide-react';
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  toggleAnnouncementAction,
} from './actions';
import styles from './anuncios.module.css';

type Post = {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  createdAt: string;
  createdBy: { fullName: string };
};

export function GestorAnunciosDirector({ announcements }: { announcements: Post[] }) {
  const router = useRouter();
  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');
  const [checked, setChecked] = useState(true);
  const [pending, startTransition] = useTransition();
  const [toast, setToast]     = useState({ msg: '', show: false });
  const [openId, setOpenId]   = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, show: true });
    timerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2200);
  }

  function publish() {
    if (!title.trim() || !content.trim()) return;
    const t = title, c = content;
    setTitle('');
    setContent('');
    showToast('Anuncio publicado');
    const fd = new FormData();
    fd.append('title', t);
    fd.append('content', c);
    if (checked) fd.append('targetRoles', 'STUDENT');
    startTransition(async () => {
      const result = await createAnnouncementAction(fd);
      if (result.ok) router.refresh();
      else showToast('Error: ' + result.error);
    });
  }

  function toggle(id: string) {
    const post = announcements.find(a => a.id === id);
    showToast(post?.isPublished ? 'Anuncio ocultado' : 'Anuncio visible');
    startTransition(async () => {
      await toggleAnnouncementAction(id);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm('¿Eliminar este anuncio?')) return;
    showToast('Anuncio eliminado');
    startTransition(async () => {
      await deleteAnnouncementAction(id);
      router.refresh();
    });
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  }

  return (
    <>
      <div className={styles.layout}>

        {/* ── Formulario ── */}
        <div className={styles.colForm}>
          <div className={styles.formTitle}>Nuevo anuncio</div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="ann-title">Título</label>
            <input
              id="ann-title"
              className={styles.input}
              maxLength={80}
              placeholder="Ej. Reunión de padres"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="ann-msg">Mensaje</label>
            <textarea
              id="ann-msg"
              className={styles.textarea}
              maxLength={800}
              placeholder="Escribe el comunicado que verán los estudiantes…"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <div className={styles.charRow}><span>{content.length}</span>/800</div>
          </div>

          <div className={styles.field} style={{ marginBottom: 0 }}>
            <label className={styles.fieldLabel}>Destinatarios</label>
            <div
              className={`${styles.check} ${checked ? styles.checkOn : ''}`}
              onClick={() => setChecked(v => !v)}
            >
              <span className={styles.checkBox}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                  strokeLinecap="round" strokeLinejoin="round" width={12} height={12}>
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </span>
              Estudiantes
            </div>
            <p className={styles.hint}>
              Los anuncios aparecen en el panel de inicio de los estudiantes.
            </p>
          </div>

          <button
            type="button"
            className={styles.submit}
            disabled={!title.trim() || !content.trim() || pending}
            onClick={publish}
          >
            <Send width={17} height={17} />
            {pending ? 'Publicando…' : 'Publicar anuncio'}
          </button>
        </div>

        {/* ── Feed ── */}
        <div className={styles.colFeed}>
          <div className={styles.feedHead}>
            <h3 className={styles.feedTitle}>Publicados</h3>
            <span className={styles.feedCount}>
              {announcements.length} {announcements.length === 1 ? 'anuncio' : 'anuncios'}
            </span>
          </div>

          {announcements.length === 0 ? (
            <div className={styles.empty}>Aún no hay anuncios publicados.</div>
          ) : (
            <div className={styles.annList}>
              {announcements.map(p => {
                const isOpen = openId === p.id;
                return (
                  <article key={p.id} className={`${styles.annItem} ${!p.isPublished ? styles.annItemHidden : ''}`}>

                    {/* ── Cabecera / trigger ── */}
                    <div className={styles.annHeader}>
                      <button
                        type="button"
                        className={styles.annTrigger}
                        onClick={() => setOpenId(isOpen ? null : p.id)}
                        aria-expanded={isOpen}
                      >
                        <span className={`${styles.tag} ${p.isPublished ? styles.tagPub : styles.tagHid}`}>
                          {p.isPublished ? 'Publicado' : 'Oculto'}
                        </span>
                        <span className={styles.annTitle}>{p.title}</span>
                        <ChevronDown
                          size={15}
                          className={`${styles.annChevron} ${isOpen ? styles.annChevronOpen : ''}`}
                        />
                      </button>

                      {/* Acciones siempre visibles */}
                      <div className={styles.postActions}>
                        <button
                          className={styles.ibtn}
                          title={p.isPublished ? 'Ocultar' : 'Mostrar'}
                          onClick={() => toggle(p.id)}
                          disabled={pending}
                        >
                          {p.isPublished ? <Eye width={15} height={15} /> : <EyeOff width={15} height={15} />}
                        </button>
                        <button
                          className={`${styles.ibtn} ${styles.ibtnDanger}`}
                          title="Eliminar"
                          onClick={() => remove(p.id)}
                          disabled={pending}
                        >
                          <Trash2 width={15} height={15} />
                        </button>
                      </div>
                    </div>

                    {/* ── Cuerpo colapsable ── */}
                    <div className={`${styles.annBody} ${isOpen ? styles.annBodyOpen : ''}`}>
                      <div className={styles.annBodyInner}>
                        <div className={styles.postMeta} suppressHydrationWarning>
                          <b>{p.createdBy.fullName}</b> · {fmtDate(p.createdAt)}
                        </div>
                        <div className={styles.postText}>{p.content}</div>
                      </div>
                    </div>

                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Toast ── */}
      <div className={`${styles.toast} ${toast.show ? styles.toastShow : ''}`}>
        <Check width={16} height={16} className={styles.toastIcon} />
        {toast.msg}
      </div>
    </>
  );
}
