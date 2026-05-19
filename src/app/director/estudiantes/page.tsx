import Link from 'next/link';
import { AlertTriangle, Search, Users } from 'lucide-react';
import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { RiskBadge } from '@/components/EtiquetaRiesgo';

export default async function DirectorEstudiantes({
  searchParams,
}: {
  searchParams: { q?: string; gradoId?: string; nivel?: string; riesgo?: string };
}) {
  const where: Prisma.StudentWhereInput = { estadoMatricula: 'DEFINITIVA' };
  const query = searchParams.q?.trim();

  if (query) {
    where.OR = [
      { dni: { contains: query } },
      { codigoEstudiante: { contains: query } },
      { nombres: { contains: query.toUpperCase() } },
      { apellidoPaterno: { contains: query.toUpperCase() } },
      { apellidoMaterno: { contains: query.toUpperCase() } },
      { user: { fullName: { contains: query, mode: 'insensitive' } } },
    ];
  }

  if (searchParams.gradoId) {
    where.section = { gradeId: searchParams.gradoId };
  } else if (searchParams.nivel === 'PRIMARIA' || searchParams.nivel === 'SECUNDARIA') {
    where.section = { grade: { nivel: searchParams.nivel } };
  }

  if (searchParams.riesgo === 'HIGH' || searchParams.riesgo === 'MID' || searchParams.riesgo === 'LOW') {
    where.responses = { some: { riskLevel: searchParams.riesgo } };
  }

  const [students, grades, totals] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        user: { select: { isActive: true, lastLogin: true } },
        section: { include: { grade: true } },
        apoderados: true,
        responses: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
          select: { riskLevel: true, riskScore: true, submittedAt: true, wantsToTalk: true },
        },
        _count: { select: { responses: true } },
      },
      orderBy: [{ apellidoPaterno: 'asc' }, { apellidoMaterno: 'asc' }, { nombres: 'asc' }],
      take: 300,
    }),
    prisma.grade.findMany({ orderBy: [{ nivel: 'asc' }, { order: 'asc' }] }),
    prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA' } }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-600" />
            Estudiantes
          </h1>
          <p className="text-slate-600 mt-1">
            Consulta integral de matrícula, contacto familiar y seguimiento socioemocional.
          </p>
        </div>
        <div className="card !p-4 min-w-[150px]">
          <p className="text-xs text-slate-500">Matrícula activa</p>
          <p className="text-2xl font-bold">{totals}</p>
        </div>
      </header>

      <form className="card grid gap-3 md:grid-cols-[1fr_160px_180px_150px_auto] md:items-end">
        <div>
          <label className="label text-xs">Buscar estudiante</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              name="q"
              defaultValue={searchParams.q || ''}
              className="input pl-10"
              placeholder="DNI, código, nombre o apellido"
            />
          </div>
        </div>

        <div>
          <label className="label text-xs">Nivel</label>
          <select name="nivel" defaultValue={searchParams.nivel || ''} className="input">
            <option value="">Todos</option>
            <option value="PRIMARIA">Primaria</option>
            <option value="SECUNDARIA">Secundaria</option>
          </select>
        </div>

        <div>
          <label className="label text-xs">Grado</label>
          <select name="gradoId" defaultValue={searchParams.gradoId || ''} className="input">
            <option value="">Todos</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'} {g.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label text-xs">Riesgo</label>
          <select name="riesgo" defaultValue={searchParams.riesgo || ''} className="input">
            <option value="">Todos</option>
            <option value="HIGH">Alto</option>
            <option value="MID">Medio</option>
            <option value="LOW">Sin riesgo</option>
          </select>
        </div>

        <button className="btn-primary" type="submit">
          Filtrar
        </button>
      </form>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Estudiante</th>
              <th className="text-left px-4 py-3">Grado</th>
              <th className="text-left px-4 py-3">Contacto principal</th>
              <th className="text-center px-4 py-3">Respuestas</th>
              <th className="text-left px-4 py-3">Último riesgo</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const contact =
                student.apoderados.find((a) => a.esContactoPrincipal) ||
                student.apoderados.find((a) => a.parentesco === 'APODERADO') ||
                student.apoderados[0];
              const latest = student.responses[0];

              return (
                <tr key={student.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">
                      {student.apellidoPaterno} {student.apellidoMaterno}, {student.nombres}
                    </p>
                    <p className="text-xs text-slate-500">
                      DNI {student.dni} · {student.edad} años · {student.sexo}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {student.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'}{' '}
                    {student.section.grade.name} {student.section.name}
                  </td>
                  <td className="px-4 py-3">
                    {contact ? (
                      <>
                        <p className="font-medium text-slate-800">{contact.apellidosNombres}</p>
                        <p className="text-xs text-slate-500">{contact.celular || 'Sin celular registrado'}</p>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Sin contacto
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">{student._count.responses}</td>
                  <td className="px-4 py-3">
                    {latest ? (
                      <div className="flex flex-col items-start gap-1">
                        <RiskBadge level={latest.riskLevel} />
                        <span className="text-xs text-slate-500">Score {latest.riskScore}</span>
                        {latest.wantsToTalk && (
                          <span className="text-xs text-warm-700">Solicitó conversar</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Sin respuestas</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/director/estudiantes/${student.id}`} className="text-brand-700 hover:underline font-medium">
                      Ver ficha
                    </Link>
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-slate-500 py-10">
                  No hay estudiantes que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
