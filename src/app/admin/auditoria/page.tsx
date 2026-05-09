import { prisma } from '@/lib/prisma';
import { FileText } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default async function AuditoriaPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: true },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <FileText className="w-6 h-6 text-brand-600" /> Auditoría
      </h1>
      <p className="text-slate-600 text-sm">Últimas 200 operaciones registradas en el sistema.</p>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-left px-4 py-3">Usuario</th>
              <th className="text-left px-4 py-3">Acción</th>
              <th className="text-left px-4 py-3">Entidad</th>
              <th className="text-left px-4 py-3">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
                <td className="px-4 py-3 text-xs">{l.user?.fullName || '—'}</td>
                <td className="px-4 py-3"><span className="badge bg-slate-100 text-slate-700 text-xs">{l.action}</span></td>
                <td className="px-4 py-3 text-xs text-slate-500">{l.entity || '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {l.metadata ? JSON.stringify(l.metadata).slice(0, 80) : '—'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">Sin registros aún.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
