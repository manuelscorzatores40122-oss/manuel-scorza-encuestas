import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Bell, CalendarDays, FileText, Phone, ShieldAlert, UserRound } from 'lucide-react';

import { RiskBadge } from '@/components/RiskBadge';
import { prisma } from '@/lib/prisma';
import { formatDate, formatDateTime } from '@/lib/utils';

export default async function DirectorFichaEstudiante({ params }: { params: { id: string } }) {
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { username: true, email: true, isActive: true, lastLogin: true, createdAt: true } },
      section: { include: { grade: true, tutor: { select: { fullName: true, email: true } } } },
      apoderados: { orderBy: [{ esContactoPrincipal: 'desc' }, { parentesco: 'asc' }] },
      responses: {
        include: {
          survey: {
            include: {
              questions: { orderBy: { order: 'asc' } },
            },
          },
          answers: true,
          alerts: { include: { rule: true }, orderBy: { triggeredAt: 'desc' } },
        },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });

  if (!student) notFound();

  const highResponses = student.responses.filter((response) => response.riskLevel === 'HIGH').length;
  const midResponses = student.responses.filter((response) => response.riskLevel === 'MID').length;
  const totalAlerts = student.responses.reduce((sum, response) => sum + response.alerts.length, 0);
  const lastResponse = student.responses[0];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <Link href="/director/estudiantes" className="inline-flex items-center gap-2 text-brand-600 hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" />
        Volver a estudiantes
      </Link>

      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {student.apellidoPaterno} {student.apellidoMaterno}, {student.nombres}
            </h1>
            <p className="text-slate-600 mt-1">
              {student.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'} {student.section.grade.name}{' '}
              {student.section.name} · {student.edad} años · {student.sexo === 'F' ? 'Femenino' : 'Masculino'}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            {lastResponse ? <RiskBadge level={lastResponse.riskLevel} /> : <span className="badge bg-slate-100 text-slate-600">Sin respuestas</span>}
            <span className="text-xs text-slate-500">
              {lastResponse ? `Última respuesta: ${formatDateTime(lastResponse.submittedAt)}` : 'Sin seguimiento registrado'}
            </span>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric label="Respuestas" value={student.responses.length} icon={<FileText className="w-5 h-5" />} />
        <Metric label="Riesgo alto" value={highResponses} icon={<ShieldAlert className="w-5 h-5" />} tone="red" />
        <Metric label="Riesgo medio" value={midResponses} icon={<Bell className="w-5 h-5" />} tone="yellow" />
        <Metric label="Alertas" value={totalAlerts} icon={<Bell className="w-5 h-5" />} tone="brand" />
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <UserRound className="w-4 h-4 text-brand-600" />
            Información del estudiante
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Info label="DNI" value={student.dni} />
            <Info label="Código de estudiante" value={student.codigoEstudiante || 'No registrado'} />
            <Info label="Fecha de nacimiento" value={formatDate(student.fechaNacimiento)} />
            <Info label="Estado de matrícula" value={student.estadoMatricula} />
            <Info label="Año académico" value={String(student.anioAcademico)} />
            <Info label="Usuario activo" value={student.user.isActive ? 'Sí' : 'No'} />
            <Info label="Usuario" value={student.user.username} />
            <Info label="Correo" value={student.user.email || 'No registrado'} />
            <Info label="Último acceso" value={student.user.lastLogin ? formatDateTime(student.user.lastLogin) : 'Sin registro'} />
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-brand-600" />
            Información académica
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Info label="Nivel" value={student.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'} />
            <Info label="Grado" value={student.section.grade.name} />
            <Info label="Sección" value={student.section.name} />
            <Info label="Tutor" value={student.section.tutor?.fullName || 'No asignado'} />
            <Info label="Correo del tutor" value={student.section.tutor?.email || 'No registrado'} />
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Phone className="w-4 h-4 text-brand-600" />
          Apoderados y contactos
        </h2>
        {student.apoderados.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-3">
            {student.apoderados.map((apoderado) => (
              <div key={apoderado.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{apoderado.apellidosNombres}</p>
                    <p className="text-xs text-slate-500">{apoderado.parentesco}</p>
                  </div>
                  {apoderado.esContactoPrincipal && (
                    <span className="badge bg-emerald-100 text-emerald-700">Principal</span>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-2 mt-3">
                  <Info label="Documento" value={[apoderado.tipoDocumento, apoderado.numeroDocumento].filter(Boolean).join(' ') || 'No registrado'} />
                  <Info label="Sexo" value={apoderado.sexo || 'No registrado'} />
                  <Info label="Celular" value={apoderado.celular || 'No registrado'} />
                  <Info label="Correo" value={apoderado.correo || 'No registrado'} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No hay apoderados registrados.</p>
        )}
      </section>

      <section className="card">
        <h2 className="font-semibold mb-4">Historial de encuestas y alertas</h2>
        <div className="space-y-4">
          {student.responses.map((response) => (
            <article key={response.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{response.survey.title}</h3>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(response.submittedAt)} · Score {response.riskScore}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <RiskBadge level={response.riskLevel} />
                  {response.wantsToTalk && (
                    <span className="badge bg-warm-100 text-warm-700">Solicitó conversar</span>
                  )}
                </div>
              </div>

              {response.alerts.length > 0 && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="font-medium text-sm text-red-900 mb-2">Alertas activadas</p>
                  <div className="space-y-2">
                    {response.alerts.map((alert) => (
                      <div key={alert.id} className="text-sm text-red-800">
                        <p>
                          <strong>{alert.rule.name}</strong> · {alert.severity}
                        </p>
                        <p className="text-xs">{alert.detail || 'Sin detalle adicional'}</p>
                        <p className="text-xs text-red-700">Activada: {formatDateTime(alert.triggeredAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-brand-700">
                  Ver respuestas registradas
                </summary>
                <div className="mt-3 space-y-3">
                  {response.survey.questions.map((question) => {
                    const answer = response.answers.find((item) => item.questionId === question.id);
                    return (
                      <div key={question.id} className="border-l-4 border-brand-200 pl-3 py-1">
                        <p className="text-sm text-slate-600">{question.text}</p>
                        <p className="font-medium text-slate-900 mt-1">{formatAnswer(answer?.value, question)}</p>
                      </div>
                    );
                  })}
                </div>
              </details>
            </article>
          ))}

          {student.responses.length === 0 && (
            <p className="text-center text-slate-500 py-8">El estudiante aún no tiene encuestas respondidas.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
  tone = 'slate',
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: 'slate' | 'red' | 'yellow' | 'brand';
}) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    brand: 'bg-brand-100 text-brand-700',
  };

  return (
    <div className="card !p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${tones[tone]}`}>{icon}</div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-900 break-words">{value}</p>
    </div>
  );
}

function formatAnswer(value: string | undefined, question: { type: string; options: unknown }): string {
  if (!value) return 'Sin respuesta';

  if (question.type === 'MULTI') {
    try {
      const selected = JSON.parse(value);
      const options = Array.isArray(question.options) ? question.options : [];
      if (!Array.isArray(selected)) return value;

      return selected
        .map((item) => findOptionLabel(options, String(item)))
        .join(', ');
    } catch {
      return value;
    }
  }

  const options = Array.isArray(question.options) ? question.options : [];
  return findOptionLabel(options, value);
}

function findOptionLabel(options: unknown[], value: string) {
  const option = options.find((item) => {
    if (!item || typeof item !== 'object') return false;
    return 'value' in item && String(item.value) === value;
  });

  if (!option || typeof option !== 'object' || !('label' in option)) return value;
  return String(option.label);
}
