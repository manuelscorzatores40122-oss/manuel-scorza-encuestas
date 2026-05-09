import Link from 'next/link';
import { ClipboardList, Heart, Sparkles, Megaphone, Phone, UserRound } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { listPublishedAnnouncementsFor } from '@/lib/announcements';

export default async function EstudianteHome() {
  const session = (await getSession())!;
  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    include: {
      section: { include: { grade: true } },
      apoderados: true,
    },
  });

  if (!student) {
    return <p>No se encontró tu ficha de estudiante.</p>;
  }

  const surveys = await prisma.survey.findMany({
    where: {
      isActive: true,
      OR: [
        { targetGrades: { has: student.section.gradeId } },
        { targetGrades: { isEmpty: true } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  const myResponses = await prisma.response.count({ where: { studentId: student.id } });
  const announcements = await listPublishedAnnouncementsFor('STUDENT', 3);
  const emergencyContact =
    student.apoderados.find((a) => a.esContactoPrincipal) ||
    student.apoderados.find((a) => a.parentesco === 'APODERADO') ||
    student.apoderados[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          ¡Hola, {student.nombres.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-600 mt-1">
          {student.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'} · {student.section.grade.name} {student.section.name}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-warm-50 to-white border-warm-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warm-500 text-white flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{surveys.length}</p>
              <p className="text-sm text-slate-600">Encuestas activas</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-brand-50 to-white border-brand-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{myResponses}</p>
              <p className="text-sm text-slate-600">Respuestas enviadas</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Tus respuestas son privadas</p>
              <p className="text-xs text-slate-600">Solo el psicólogo las puede leer</p>
            </div>
          </div>
        </div>
      </div>

      {announcements.length > 0 && (
        <section className="card bg-gradient-to-br from-brand-50 to-white border-brand-200">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-brand-600" /> Anuncios
            </h2>
            <Link href="/estudiante/anuncios" className="text-sm text-brand-600 hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {announcements.map((a) => (
              <article key={a.id} className="rounded-xl bg-white/80 border border-brand-100 p-4">
                <p className="font-semibold text-slate-900">{a.title}</p>
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{a.content}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Phone className="w-5 h-5 text-emerald-600" /> Contacto de emergencia
          </h2>
          {emergencyContact ? (
            <div className="space-y-1 text-sm">
              <p className="font-medium text-slate-900">{emergencyContact.apellidosNombres}</p>
              <p className="text-slate-500">{emergencyContact.parentesco}</p>
              <p className="text-slate-700">Celular: {emergencyContact.celular || 'No registrado'}</p>
              {emergencyContact.correo && <p className="text-slate-700">Correo: {emergencyContact.correo}</p>}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Aún no tienes contacto de emergencia registrado.</p>
          )}
        </div>

        <Link href="/estudiante/perfil" className="card hover:border-warm-300 hover:bg-warm-50 transition-colors">
          <UserRound className="w-8 h-8 text-warm-600 mb-3" />
          <p className="font-semibold text-slate-900">Actualizar perfil</p>
          <p className="text-sm text-slate-600 mt-1">Edita datos de padre, madre, apoderado y número de emergencia.</p>
        </Link>
      </section>

      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Encuestas disponibles</h2>
          <Link href="/estudiante/encuestas" className="text-sm text-brand-600 hover:underline">
            Ver todas →
          </Link>
        </div>

        {surveys.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No hay encuestas activas en este momento. Vuelve más tarde 🌱
          </p>
        ) : (
          <div className="space-y-3">
            {surveys.slice(0, 3).map((s) => (
              <Link
                key={s.id}
                href={`/estudiante/encuestas/${s.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-warm-400 hover:bg-warm-50 transition-all group"
              >
                <div>
                  <p className="font-medium text-slate-900">{s.title}</p>
                  {s.description && <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{s.description}</p>}
                </div>
                <span className="text-warm-600 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
