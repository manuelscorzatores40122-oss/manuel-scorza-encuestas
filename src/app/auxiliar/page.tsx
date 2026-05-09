import Link from 'next/link';
import { Users, FileBarChart } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export default async function AuxiliarHome() {
  const [totalStudents, totalResponses, totalSurveys] = await Promise.all([
    prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA' } }),
    prisma.response.count(),
    prisma.survey.count({ where: { isActive: true } }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold">Panel del Auxiliar</h1>
        <p className="text-slate-600 mt-1">Información general de estudiantes</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card">
          <p className="text-xs text-slate-500">Estudiantes activos</p>
          <p className="text-3xl font-bold text-brand-700">{totalStudents}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500">Respuestas registradas</p>
          <p className="text-3xl font-bold text-purple-700">{totalResponses}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500">Encuestas activas</p>
          <p className="text-3xl font-bold text-emerald-700">{totalSurveys}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Link href="/auxiliar/estudiantes" className="card hover:shadow-md transition-shadow">
          <Users className="w-6 h-6 text-brand-600 mb-2" />
          <p className="font-semibold">Ver estudiantes</p>
          <p className="text-xs text-slate-500 mt-1">Lista completa</p>
        </Link>
        <Link href="/auxiliar/respuestas" className="card hover:shadow-md transition-shadow">
          <FileBarChart className="w-6 h-6 text-brand-600 mb-2" />
          <p className="font-semibold">Respuestas recientes</p>
          <p className="text-xs text-slate-500 mt-1">Sin información de riesgo</p>
        </Link>
      </div>

      <div className="card bg-slate-50 border-slate-200">
        <p className="text-sm text-slate-700">
          ℹ️ Como auxiliar, puedes ver las respuestas de todos los estudiantes pero no las alertas de riesgo. Si detectas algún caso preocupante, comunícalo al psicólogo.
        </p>
      </div>
    </div>
  );
}
