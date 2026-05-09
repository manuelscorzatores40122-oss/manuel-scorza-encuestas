import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import { RiskBadge } from '@/components/RiskBadge';
import { StudentTimeline } from './StudentTimeline';

export default async function HistorialEstudiante({ params }: { params: { id: string } }) {
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      section: { include: { grade: true } },
      apoderados: true,
      responses: {
        include: { survey: true, alerts: true },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });
  if (!student) notFound();

  const trend = student.responses.slice().reverse().map((r) => ({
    fecha: r.submittedAt.toISOString().slice(5, 10),
    score: r.riskScore,
  }));
  const emergencyContact =
    student.apoderados.find((a) => a.esContactoPrincipal) ||
    student.apoderados.find((a) => a.parentesco === 'APODERADO') ||
    student.apoderados[0];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <Link href="/psicologo/estudiantes" className="inline-flex items-center gap-2 text-brand-600 hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>

      <div className="card">
        <h1 className="text-2xl font-bold">{student.apellidoPaterno} {student.apellidoMaterno}, {student.nombres}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {student.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'} {student.section.grade.name} {student.section.name} · {student.edad} años · {student.sexo === 'F' ? 'Mujer' : 'Hombre'}
        </p>
      </div>

      {trend.length > 0 && <StudentTimeline data={trend} />}

      <div className="card bg-emerald-50 border-emerald-200">
        <h2 className="font-semibold mb-3 flex items-center gap-2 text-emerald-900">
          <Phone className="w-4 h-4" /> Contacto de emergencia
        </h2>
        {emergencyContact ? (
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Nombre</p>
              <p className="font-medium text-slate-900">{emergencyContact.apellidosNombres}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Parentesco</p>
              <p className="font-medium text-slate-900">{emergencyContact.parentesco}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Celular</p>
              <p className="font-medium text-slate-900">{emergencyContact.celular || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Correo</p>
              <p className="font-medium text-slate-900">{emergencyContact.correo || 'No registrado'}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">No hay contacto registrado.</p>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Respuestas ({student.responses.length})</h2>
        <div className="space-y-2">
          {student.responses.map((r) => (
            <Link key={r.id} href={`/psicologo/respuestas/${r.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-slate-100">
              <div>
                <p className="font-medium text-sm">{r.survey.title}</p>
                <p className="text-xs text-slate-500">{formatDateTime(r.submittedAt)} · Score {r.riskScore} · {r.alerts.length} alerta(s)</p>
              </div>
              <RiskBadge level={r.riskLevel} />
            </Link>
          ))}
          {student.responses.length === 0 && (
            <p className="text-center text-slate-500 py-8">El estudiante aún no ha respondido encuestas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
