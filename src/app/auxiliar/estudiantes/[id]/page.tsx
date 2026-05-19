import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, BookOpen } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';

export default async function AuxiliarFichaEstudiante({ params }: { params: { id: string } }) {
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      section: { include: { grade: true } },
      apoderados: true,
      responses: {
        include: { survey: true },
        orderBy: { submittedAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!student) notFound();

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <Link
        href="/auxiliar/estudiantes"
        className="inline-flex items-center gap-2 text-brand-600 hover:underline text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a estudiantes
      </Link>

      {/* Datos personales */}
      <div className="card">
        <h1 className="text-xl font-bold text-slate-900">
          {student.apellidoPaterno} {student.apellidoMaterno}, {student.nombres}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {student.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'}{' '}
          {student.section.grade.name} {student.section.name} · {student.edad} años ·{' '}
          {student.sexo === 'F' ? 'Femenino' : 'Masculino'}
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-4 text-sm">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">DNI</p>
            <p className="font-mono font-medium">{student.dni}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Código</p>
            <p className="font-mono font-medium">{student.codigoEstudiante || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Estado matrícula</p>
            <p className="font-medium capitalize">{student.estadoMatricula.toLowerCase()}</p>
          </div>
        </div>
      </div>

      {/* Apoderados */}
      <div className="card">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Phone className="w-4 h-4 text-brand-600" /> Contacto familiar
        </h2>

        {student.apoderados.length === 0 ? (
          <p className="text-sm text-slate-500">No hay apoderados registrados.</p>
        ) : (
          <div className="space-y-4">
            {student.apoderados.map((a) => (
              <div key={a.id} className="grid sm:grid-cols-2 gap-3 text-sm border-t border-slate-100 pt-3 first:border-0 first:pt-0">
                <div>
                  <p className="text-xs text-slate-400">Nombre</p>
                  <p className="font-medium">{a.apellidosNombres}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Parentesco</p>
                  <p>{a.parentesco}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Celular</p>
                  <p>{a.celular || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Correo</p>
                  <p>{a.correo || '—'}</p>
                </div>
                {a.esContactoPrincipal && (
                  <div className="sm:col-span-2">
                    <span className="badge bg-brand-100 text-brand-700">Contacto principal</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Encuestas — sin nivel de riesgo ni alertas */}
      <div className="card">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-600" /> Encuestas respondidas ({student.responses.length})
        </h2>

        <p className="text-xs text-slate-400 mb-3 italic">
          Los niveles de riesgo son visibles solo para el psicólogo.
        </p>

        {student.responses.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            El estudiante aún no ha respondido encuestas.
          </p>
        ) : (
          <div className="space-y-2">
            {student.responses.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50"
              >
                <div>
                  <p className="font-medium text-sm">{r.survey.title}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(r.submittedAt)}</p>
                </div>
                <span className="badge bg-emerald-100 text-emerald-700">Completada</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
