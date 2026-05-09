import Link from 'next/link';
import { Plus, ClipboardList, Power } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { toggleSurveyAction } from './actions';

export default async function EncuestasPsicologo() {
  const surveys = await prisma.survey.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { responses: true, questions: true } } },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-brand-600" /> Encuestas
        </h1>
        <Link href="/psicologo/encuestas/nueva" className="btn-primary">
          <Plus className="w-4 h-4" /> Nueva encuesta
        </Link>
      </div>

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Título</th>
              <th className="text-center px-4 py-3">Preguntas</th>
              <th className="text-center px-4 py-3">Respuestas</th>
              <th className="text-center px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3">Creada</th>
              <th className="text-right px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {surveys.map((s) => (
              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{s.title}</td>
                <td className="px-4 py-3 text-center">{s._count.questions}</td>
                <td className="px-4 py-3 text-center">{s._count.responses}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`badge ${s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {s.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(s.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <form action={toggleSurveyAction.bind(null, s.id)}>
                    <button className="text-slate-600 hover:text-brand-600 inline-flex items-center gap-1 text-xs">
                      <Power className="w-3 h-3" /> {s.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {surveys.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-12">No hay encuestas creadas todavía.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
