import { prisma } from '@/lib/prisma';
import { ShieldAlert } from 'lucide-react';
import { RulesEditor } from './RulesEditor';

export default async function ReglasPage() {
  const rules = await prisma.alertRule.findMany({ orderBy: { createdAt: 'asc' } });
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ShieldAlert className="w-6 h-6 text-red-600" /> Reglas de alerta
      </h1>
      <p className="text-slate-600 text-sm">
        Tres mecanismos en paralelo: palabras clave en texto abierto, combinaciones de respuestas y umbrales de score acumulado.
      </p>
      <RulesEditor rules={rules.map((r) => ({
        id: r.id, name: r.name, type: r.type, severity: r.severity,
        config: r.config as any, isActive: r.isActive,
      }))} />
    </div>
  );
}
