'use client';

import { useState, useTransition } from 'react';
import { Plus, Save, Trash2, Power } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { saveRuleAction, toggleRuleAction, deleteRuleAction } from './actions';

type Rule = {
  id: string;
  name: string;
  type: 'KEYWORD' | 'COMBINATION' | 'SCORE';
  severity: string;
  config: any;
  isActive: boolean;
};

export function RulesEditor({ rules }: { rules: Rule[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Rule | null>(null);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function save(rule: Partial<Rule>) {
    startTransition(async () => {
      const r = await saveRuleAction(rule);
      if (r.ok) {
        setMsg('Regla guardada');
        setEditing(null);
        router.refresh();
      } else setMsg(`Error: ${r.error}`);
    });
  }

  function toggle(id: string) {
    startTransition(async () => {
      await toggleRuleAction(id);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm('¿Eliminar esta regla?')) return;
    startTransition(async () => {
      await deleteRuleAction(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {msg && <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm">{msg}</div>}

      <button
        onClick={() => setEditing({ id: '', name: '', type: 'KEYWORD', severity: 'MID', config: { keywords: [] }, isActive: true })}
        className="btn-primary"
      >
        <Plus className="w-4 h-4" /> Nueva regla
      </button>

      {editing && <RuleForm rule={editing} onSave={save} onCancel={() => setEditing(null)} pending={pending} />}

      <div className="space-y-3">
        {rules.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{r.name}</h3>
                  <span className={`badge ${r.severity === 'HIGH' ? 'bg-red-100 text-red-700' : r.severity === 'MID' ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {r.severity}
                  </span>
                  <span className={`badge ${r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {r.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Tipo: {r.type}</p>
                <RuleSummary rule={r} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(r)} className="btn-secondary text-xs">Editar</button>
                <button onClick={() => toggle(r.id)} className="btn-secondary text-xs"><Power className="w-3 h-3" /></button>
                <button onClick={() => remove(r.id)} className="text-red-600 text-xs px-3"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        ))}
        {rules.length === 0 && <p className="text-center text-slate-500 py-8">No hay reglas configuradas.</p>}
      </div>
    </div>
  );
}

function RuleSummary({ rule }: { rule: Rule }) {
  if (rule.type === 'KEYWORD') {
    return <p className="text-xs text-slate-600">Palabras: {(rule.config?.keywords || []).join(', ') || '(vacío)'}</p>;
  }
  if (rule.type === 'COMBINATION') {
    return <p className="text-xs text-slate-600">{(rule.config?.rules || []).length} condiciones combinadas</p>;
  }
  if (rule.type === 'SCORE') {
    return <p className="text-xs text-slate-600">Umbral ≥ {rule.config?.threshold}</p>;
  }
  return null;
}

function RuleForm({ rule, onSave, onCancel, pending }: { rule: Rule; onSave: (r: Partial<Rule>) => void; onCancel: () => void; pending: boolean }) {
  const [name, setName] = useState(rule.name);
  const [type, setType] = useState(rule.type);
  const [severity, setSeverity] = useState(rule.severity);
  const [keywords, setKeywords] = useState<string>(((rule.config?.keywords) || []).join(', '));
  const [threshold, setThreshold] = useState<number>(rule.config?.threshold || 8);
  const [combo, setCombo] = useState<string>(JSON.stringify(rule.config?.rules || [], null, 2));

  function submit() {
    let config: any = {};
    if (type === 'KEYWORD') config = { keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean) };
    if (type === 'SCORE') config = { threshold: Number(threshold) };
    if (type === 'COMBINATION') {
      try { config = { rules: JSON.parse(combo) }; }
      catch { return alert('JSON de combinación inválido'); }
    }
    onSave({ id: rule.id, name, type, severity, config, isActive: rule.isActive });
  }

  return (
    <div className="card border-2 border-brand-300">
      <h3 className="font-semibold mb-3">{rule.id ? 'Editar regla' : 'Nueva regla'}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Nombre</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Severidad</label>
          <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="LOW">Baja</option>
            <option value="MID">Media</option>
            <option value="HIGH">Alta</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Tipo</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="KEYWORD">Palabras clave</option>
            <option value="COMBINATION">Combinación de respuestas</option>
            <option value="SCORE">Umbral de score</option>
          </select>
        </div>

        {type === 'KEYWORD' && (
          <div className="sm:col-span-2">
            <label className="label">Palabras / frases (separadas por coma)</label>
            <textarea className="input" rows={3} value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          </div>
        )}
        {type === 'SCORE' && (
          <div className="sm:col-span-2">
            <label className="label">Umbral mínimo</label>
            <input type="number" className="input" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
          </div>
        )}
        {type === 'COMBINATION' && (
          <div className="sm:col-span-2">
            <label className="label">Reglas (JSON: array de {`{questionOrder, valueIn:[]}`})</label>
            <textarea className="input font-mono text-xs" rows={6} value={combo} onChange={(e) => setCombo(e.target.value)} />
            <p className="text-xs text-slate-500 mt-1">Ejemplo: <code>[{`{"questionOrder":1,"valueIn":["mal","muy_mal"]}`}]</code></p>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button onClick={submit} disabled={pending} className="btn-primary"><Save className="w-4 h-4" /> Guardar</button>
      </div>
    </div>
  );
}
