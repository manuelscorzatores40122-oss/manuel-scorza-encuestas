'use client';

import { useState, useTransition } from 'react';
import { Plus, Save, Trash2, Power } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { saveRuleAction, toggleRuleAction, deleteRuleAction } from './actions';
import styles from './EditorReglas.module.css';

type Rule = {
  id: string;
  name: string;
  type: 'KEYWORD' | 'COMBINATION' | 'SCORE';
  severity: string;
  config: any;
  isActive: boolean;
};

const TYPE_LABELS: Record<string, string> = {
  KEYWORD:     'Palabras clave',
  COMBINATION: 'Combinación de respuestas',
  SCORE:       'Umbral de score',
};

function severityClass(s: string) {
  if (s === 'HIGH') return styles.severityHigh;
  if (s === 'MID')  return styles.severityMid;
  return styles.severityLow;
}

function RuleSummary({ rule }: { rule: Rule }) {
  if (rule.type === 'KEYWORD') {
    const kws = (rule.config?.keywords || []).join(', ') || '(vacío)';
    return <p className={styles.ruleSummary}>Palabras: {kws}</p>;
  }
  if (rule.type === 'COMBINATION') {
    return <p className={styles.ruleSummary}>{(rule.config?.rules || []).length} condiciones combinadas</p>;
  }
  if (rule.type === 'SCORE') {
    return <p className={styles.ruleSummary}>Umbral ≥ {rule.config?.threshold}</p>;
  }
  return null;
}

function RuleForm({
  rule, onSave, onCancel, pending,
}: {
  rule: Rule;
  onSave: (r: Partial<Rule>) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [name,      setName]      = useState(rule.name);
  const [type,      setType]      = useState(rule.type);
  const [severity,  setSeverity]  = useState(rule.severity);
  const [keywords,  setKeywords]  = useState<string>(((rule.config?.keywords) || []).join(', '));
  const [threshold, setThreshold] = useState<number>(rule.config?.threshold || 8);
  const [combo,     setCombo]     = useState<string>(JSON.stringify(rule.config?.rules || [], null, 2));

  function submit() {
    let config: any = {};
    if (type === 'KEYWORD')     config = { keywords: keywords.split(',').map(k => k.trim()).filter(Boolean) };
    if (type === 'SCORE')       config = { threshold: Number(threshold) };
    if (type === 'COMBINATION') {
      try { config = { rules: JSON.parse(combo) }; }
      catch { alert('JSON de combinación inválido'); return; }
    }
    onSave({ id: rule.id, name, type, severity, config, isActive: rule.isActive });
  }

  return (
    <div className={styles.form}>
      <p className={styles.formTitle}>{rule.id ? 'Editar regla' : 'Nueva regla'}</p>

      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label className={styles.label}>Nombre</label>
          <input className={styles.input} value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className={styles.formField}>
          <label className={styles.label}>Severidad</label>
          <select className={styles.input} value={severity} onChange={e => setSeverity(e.target.value)}>
            <option value="LOW">Baja</option>
            <option value="MID">Media</option>
            <option value="HIGH">Alta</option>
          </select>
        </div>

        <div className={`${styles.formField} ${styles.formFieldFull}`}>
          <label className={styles.label}>Tipo</label>
          <select className={styles.input} value={type} onChange={e => setType(e.target.value as any)}>
            <option value="KEYWORD">Palabras clave</option>
            <option value="COMBINATION">Combinación de respuestas</option>
            <option value="SCORE">Umbral de score</option>
          </select>
        </div>

        {type === 'KEYWORD' && (
          <div className={`${styles.formField} ${styles.formFieldFull}`}>
            <label className={styles.label}>Palabras / frases (separadas por coma)</label>
            <textarea
              className={styles.input}
              rows={3}
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
            />
          </div>
        )}

        {type === 'SCORE' && (
          <div className={`${styles.formField} ${styles.formFieldFull}`}>
            <label className={styles.label}>Umbral mínimo</label>
            <input
              type="number"
              className={styles.input}
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
            />
          </div>
        )}

        {type === 'COMBINATION' && (
          <div className={`${styles.formField} ${styles.formFieldFull}`}>
            <label className={styles.label}>
              Reglas (JSON: array de {`{questionOrder, valueIn:[]}`})
            </label>
            <textarea
              className={styles.inputMono}
              rows={6}
              value={combo}
              onChange={e => setCombo(e.target.value)}
            />
            <p className={styles.hint}>
              Ejemplo: <code>[{`{"questionOrder":1,"valueIn":["mal","muy_mal"]}`}]</code>
            </p>
          </div>
        )}
      </div>

      <div className={styles.formActions}>
        <button onClick={onCancel} className={styles.btnSecondary}>Cancelar</button>
        <button onClick={submit} disabled={pending} className={styles.btnPrimary}>
          <Save style={{ width: 14, height: 14 }} strokeWidth={2} />
          Guardar
        </button>
      </div>
    </div>
  );
}

export function EditorReglas({ rules }: { rules: Rule[] }) {
  const router = useRouter();
  const [editing, setEditing]      = useState<Rule | null>(null);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg]              = useState<string | null>(null);

  function save(rule: Partial<Rule>) {
    startTransition(async () => {
      const r = await saveRuleAction(rule);
      if (r.ok) {
        setMsg('Regla guardada correctamente.');
        setEditing(null);
        router.refresh();
      } else {
        setMsg(`Error: ${r.error}`);
      }
    });
  }

  function toggle(id: string) {
    startTransition(async () => { await toggleRuleAction(id); router.refresh(); });
  }

  function remove(id: string) {
    if (!confirm('¿Eliminar esta regla?')) return;
    startTransition(async () => { await deleteRuleAction(id); router.refresh(); });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {msg && (
        <div className={styles.msgBanner}>
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className={styles.msgClose}>cerrar</button>
        </div>
      )}

      <div>
        <button
          onClick={() => setEditing({ id: '', name: '', type: 'KEYWORD', severity: 'MID', config: { keywords: [] }, isActive: true })}
          className={styles.newBtn}
        >
          <Plus style={{ width: 15, height: 15 }} strokeWidth={2} />
          Nueva regla
        </button>
      </div>

      {editing && (
        <RuleForm rule={editing} onSave={save} onCancel={() => setEditing(null)} pending={pending} />
      )}

      <div className={styles.list}>
        {rules.map(r => (
          <div key={r.id} className={styles.ruleCard}>
            <div className={styles.ruleInfo}>
              <div className={styles.ruleTitleRow}>
                <h3 className={styles.ruleName}>{r.name}</h3>
                <span className={severityClass(r.severity)}>{r.severity}</span>
                <span className={r.isActive ? styles.statusActive : styles.statusInactive}>
                  {r.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <p className={styles.ruleType}>Tipo: {TYPE_LABELS[r.type] ?? r.type}</p>
              <RuleSummary rule={r} />
            </div>

            <div className={styles.ruleActions}>
              <button onClick={() => setEditing(r)} className={styles.btnEdit}>Editar</button>
              <button
                onClick={() => toggle(r.id)}
                disabled={pending}
                className={styles.btnIcon}
                title={r.isActive ? 'Desactivar' : 'Activar'}
              >
                <Power style={{ width: 14, height: 14 }} strokeWidth={1.8} />
              </button>
              <button
                onClick={() => remove(r.id)}
                disabled={pending}
                className={styles.btnIconDanger}
                title="Eliminar"
              >
                <Trash2 style={{ width: 14, height: 14 }} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <p className={styles.empty}>No hay reglas configuradas.</p>
        )}
      </div>
    </div>
  );
}
