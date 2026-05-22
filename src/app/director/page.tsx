import { Users, ClipboardList, AlertTriangle, TrendingUp } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { GraficosDirector } from './GraficosDirector';

type GradeRiskRow = {
  grado: string;
  riskLevel: string;
  total: bigint;
};

export default async function DirectorDashboard() {
  const [
    totalEstudiantes,
    totalRespuestas,
    riesgoAlto,
    riesgoMedio,
    encuestasActivas,
    primaria,
    secundaria,
    porGradoRows,
    riskDist,
  ] = await Promise.all([
    prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA' } }),
    prisma.response.count(),
    prisma.response.count({ where: { riskLevel: 'HIGH' } }),
    prisma.response.count({ where: { riskLevel: 'MID' } }),
    prisma.survey.count({ where: { isActive: true } }),
    prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA', section: { grade: { nivel: 'PRIMARIA' } } } }),
    prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA', section: { grade: { nivel: 'SECUNDARIA' } } } }),
    prisma.$queryRaw<GradeRiskRow[]>`
      SELECT
        CASE WHEN g.nivel = 'PRIMARIA' THEN 'Pri ' ELSE 'Sec ' END || g.name AS grado,
        r."riskLevel",
        COUNT(*) AS total
      FROM "Response" r
      INNER JOIN "Student" s ON s.id = r."studentId"
      INNER JOIN "Section" sec ON sec.id = s."sectionId"
      INNER JOIN "Grade" g ON g.id = sec."gradeId"
      GROUP BY g.nivel, g.name, g."order", r."riskLevel"
      ORDER BY g.nivel, g."order"
    `,
    prisma.response.groupBy({ by: ['riskLevel'], _count: true }),
  ]);

  // Bucket por grado anonimizado
  const byGrade: Record<string, { total: number; alto: number; medio: number }> = {};
  for (const row of porGradoRows) {
    const key = row.grado;
    const total = Number(row.total);
    byGrade[key] = byGrade[key] || { total: 0, alto: 0, medio: 0 };
    byGrade[key].total += total;
    if (row.riskLevel === 'HIGH') byGrade[key].alto += total;
    if (row.riskLevel === 'MID') byGrade[key].medio += total;
  }
  const gradeData = Object.entries(byGrade)
    .sort()
    .map(([grado, v]) => ({ grado, ...v }));

  const riskData = [
    { name: 'Sin riesgo', value: riskDist.find((r) => r.riskLevel === 'LOW')?._count || 0, color: '#16a34a' },
    { name: 'Riesgo medio', value: riskDist.find((r) => r.riskLevel === 'MID')?._count || 0, color: '#eab308' },
    { name: 'Riesgo alto', value: riskDist.find((r) => r.riskLevel === 'HIGH')?._count || 0, color: '#dc2626' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">Panel del Director</h1>
        <p className="text-slate-600 mt-1">Estadísticas agregadas — sin identificación individual</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card label="Estudiantes" value={totalEstudiantes} icon={<Users className="w-5 h-5" />} color="bg-brand-100 text-brand-700" />
        <Card label="Respuestas" value={totalRespuestas} icon={<TrendingUp className="w-5 h-5" />} color="bg-purple-100 text-purple-700" />
        <Card label="Riesgo medio" value={riesgoMedio} icon={<AlertTriangle className="w-5 h-5" />} color="bg-yellow-100 text-yellow-700" />
        <Card label="Riesgo alto" value={riesgoAlto} icon={<AlertTriangle className="w-5 h-5" />} color="bg-red-100 text-red-700" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold mb-3">Población estudiantil</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-brand-50 border border-brand-100">
              <p className="text-xs text-slate-500">Primaria</p>
              <p className="text-3xl font-bold text-brand-700">{primaria}</p>
              <p className="text-xs text-slate-500 mt-1">{totalEstudiantes > 0 ? ((primaria/totalEstudiantes)*100).toFixed(0) : 0}%</p>
            </div>
            <div className="p-4 rounded-xl bg-warm-50 border border-warm-100">
              <p className="text-xs text-slate-500">Secundaria</p>
              <p className="text-3xl font-bold text-warm-700">{secundaria}</p>
              <p className="text-xs text-slate-500 mt-1">{totalEstudiantes > 0 ? ((secundaria/totalEstudiantes)*100).toFixed(0) : 0}%</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">Encuestas activas: {encuestasActivas}</p>
        </div>

        <GraficosDirector riskData={riskData} gradeData={gradeData} />
      </div>

      <div className="card bg-slate-50 border-slate-200">
        <p className="text-sm text-slate-700">
          🔒 Por confidencialidad, no se muestran datos individuales de estudiantes. Para casos específicos, coordina con el psicólogo del colegio.
        </p>
      </div>
    </div>
  );
}

function Card({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="card !p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>{icon}</div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
