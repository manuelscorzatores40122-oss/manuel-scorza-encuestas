'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronDown, ChevronLeft, ChevronRight,
  Eye, Pencil, Power, Trash2, Check, X, ListChecks,
} from 'lucide-react';
import { toggleSurveyAction, deleteSurveyAction, updateSurveyAction } from './actions';
import { formatDate } from '@/lib/utils';
import styles from './page.module.css';

const PAGE_SIZE = 10;

type Survey = {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { responses: number; questions: number };
};

export function GestorEncuestas({ surveys }: { surveys: Survey[] }) {
  const router                          = useRouter();
  const [pending, startTransition]      = useTransition();
  const [openId,  setOpenId]            = useState<string | null>(null);
  const [editId,  setEditId]            = useState<string | null>(null);
  const [editTitle, setEditTitle]       = useState('');
  const [editDesc,  setEditDesc]        = useState('');
  const [page, setPage]                 = useState(0);

  const totalPages = Math.ceil(surveys.length / PAGE_SIZE);
  const pageItems  = surveys.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function openEdit(s: Survey) {
    setEditId(s.id);
    setEditTitle(s.title);
    setEditDesc(s.description ?? '');
    setOpenId(s.id);
  }

  function cancelEdit() {
    setEditId(null);
  }

  function saveEdit(id: string) {
    startTransition(async () => {
      await updateSurveyAction(id, editTitle, editDesc);
      setEditId(null);
      router.refresh();
    });
  }

  function toggle(id: string) {
    startTransition(async () => {
      await toggleSurveyAction(id);
      router.refresh();
    });
  }

  function remove(s: Survey) {
    const msg = s._count.responses > 0
      ? `La encuesta "${s.title}" tiene ${s._count.responses} respuesta(s). Se eliminarán la encuesta, preguntas, respuestas y alertas. ¿Continuar?`
      : `¿Eliminar definitivamente la encuesta "${s.title}"?`;
    if (!confirm(msg)) return;
    startTransition(async () => {
      await deleteSurveyAction(s.id);
      router.refresh();
    });
  }

  function goPage(p: number) {
    setPage(p);
    setOpenId(null);
    setEditId(null);
  }

  return (
    <div className={styles.gestorWrap}>

      {/* ── Lista acordeón ── */}
      <div className={styles.accList}>
        {pageItems.map(s => {
          const isOpen    = openId  === s.id;
          const isEditing = editId  === s.id;

          return (
            <article
              key={s.id}
              className={`${styles.accItem} ${!s.isActive ? styles.accItemOff : ''}`}
            >
              {/* Cabecera */}
              <div className={styles.accHeader}>
                <button
                  type="button"
                  className={styles.accTrigger}
                  onClick={() => setOpenId(isOpen ? null : s.id)}
                  aria-expanded={isOpen}
                >
                  <span className={`${styles.accBadge} ${s.isActive ? styles.accBadgeOn : styles.accBadgeOff}`}>
                    <span className={styles.accBadgeDot} />
                    {s.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                  <span className={styles.accTitle}>{s.title}</span>
                  <span className={styles.accMeta}>
                    {s._count.questions} {s._count.questions === 1 ? 'pregunta' : 'preguntas'}
                    {' · '}
                    {s._count.responses} {s._count.responses === 1 ? 'respuesta' : 'respuestas'}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`${styles.accChevron} ${isOpen ? styles.accChevronOpen : ''}`}
                  />
                </button>

                <div className={styles.accActions}>
                  <Link
                    href={`/psicologo/encuestas/${s.id}`}
                    className={styles.ibtn}
                    title="Ver resultados"
                  >
                    <Eye size={15} />
                  </Link>
                  <button
                    type="button"
                    className={styles.ibtn}
                    title="Editar título y descripción"
                    disabled={pending}
                    onClick={() => openEdit(s)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className={styles.ibtn}
                    title={s.isActive ? 'Desactivar' : 'Activar'}
                    disabled={pending}
                    onClick={() => toggle(s.id)}
                  >
                    <Power size={15} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.ibtn} ${styles.ibtnDanger}`}
                    title="Eliminar"
                    disabled={pending}
                    onClick={() => remove(s)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Cuerpo colapsable */}
              <div className={`${styles.accBody} ${isOpen ? styles.accBodyOpen : ''}`}>
                <div className={styles.accInner}>
                  {isEditing ? (
                    <div className={styles.editForm}>
                      <div className={styles.editField}>
                        <label className={styles.editLabel}>Título</label>
                        <input
                          className={styles.editInput}
                          value={editTitle}
                          maxLength={120}
                          onChange={e => setEditTitle(e.target.value)}
                        />
                      </div>
                      <div className={styles.editField}>
                        <label className={styles.editLabel}>Descripción (opcional)</label>
                        <textarea
                          className={styles.editTextarea}
                          value={editDesc}
                          maxLength={400}
                          rows={3}
                          onChange={e => setEditDesc(e.target.value)}
                        />
                      </div>
                      <div className={styles.editActions}>
                        <button
                          type="button"
                          className={styles.editSave}
                          disabled={pending || !editTitle.trim()}
                          onClick={() => saveEdit(s.id)}
                        >
                          <Check size={14} /> Guardar
                        </button>
                        <button
                          type="button"
                          className={styles.editCancel}
                          onClick={cancelEdit}
                        >
                          <X size={14} /> Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.accContent}>
                      {s.description && (
                        <p className={styles.accDesc}>{s.description}</p>
                      )}
                      <div className={styles.accStats}>
                        <span><b>{s._count.questions}</b> preguntas</span>
                        <span><b>{s._count.responses}</b> respuestas</span>
                        <span className={styles.accDate}>{formatDate(s.createdAt)}</span>
                      </div>
                      <div className={styles.accLinks}>
                        <Link
                          href={`/psicologo/encuestas/${s.id}`}
                          className={styles.accLink}
                        >
                          <Eye size={13} /> Ver resultados
                        </Link>
                        <Link
                          href={`/psicologo/encuestas/${s.id}/editar`}
                          className={`${styles.accLink} ${styles.accLinkEdit}`}
                        >
                          <ListChecks size={13} /> Editar preguntas
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* ── Paginación ── */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page === 0}
            onClick={() => goPage(page - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className={styles.pageInfo}>
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page >= totalPages - 1}
            onClick={() => goPage(page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
