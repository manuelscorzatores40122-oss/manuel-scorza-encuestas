import Link from 'next/link';
import {
  Users,
  ClipboardList,
  AlertTriangle,
  FileText,
  Upload,
  ShieldAlert,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';

export default async function AdminDashboard() {
  try {
    const [
      totalStudents,
      totalUsers,
      totalSurveys,
      totalAlerts,
      activeRules,
      recentLogs,
      primaria,
      secundaria,
    ] = await Promise.all([
      prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.survey.count(),
      prisma.alert.count(),
      prisma.alertRule.count({ where: { isActive: true } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { user: true },
      }),
      prisma.student.count({
        where: {
          estadoMatricula: 'DEFINITIVA',
          section: { grade: { nivel: 'PRIMARIA' } },
        },
      }),
      prisma.student.count({
        where: {
          estadoMatricula: 'DEFINITIVA',
          section: { grade: { nivel: 'SECUNDARIA' } },
        },
      }),
    ]);

    return (
      <DashboardView
        totalStudents={totalStudents}
        totalUsers={totalUsers}
        totalSurveys={totalSurveys}
        totalAlerts={totalAlerts}
        activeRules={activeRules}
        recentLogs={recentLogs}
        primaria={primaria}
        secundaria={secundaria}
      />
    );
  } catch (error) {
    console.error('Error conectando a la base de datos:', error);

    return (
      <div className="space-y-6 animate-fade-in">
        <header>
          <h1 className="text-2xl md:text-3xl font-bold">
            Panel del Administrador
          </h1>
          <p className="text-slate-600 mt-1">
            Configuración y gestión global del sistema
          </p>
        </header>

        <div className="card border-red-200 bg-red-50">
          <h2 className="font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            No se pudo conectar con la base de datos
          </h2>

          <p className="text-sm text-red-700 mt-2">
            Prisma no puede conectarse a PostgreSQL/Neon. Revisa tu archivo
            <code className="mx-1">.env</code>, la contraseña, el estado del
            proyecto en Neon y la conexión de red.
          </p>

          <div className="mt-4 text-sm text-red-700 space-y-1">
            <p>Prueba estos comandos:</p>
            <pre className="bg-white rounded-lg p-3 overflow-x-auto text-xs">
{`npx prisma db pull
npx prisma generate
npm run dev`}
            </pre>
          </div>
        </div>
      </div>
    );
  }
}

function DashboardView({
  totalStudents,
  totalUsers,
  totalSurveys,
  totalAlerts,
  activeRules,
  recentLogs,
  primaria,
  secundaria,
}: {
  totalStudents: number;
  totalUsers: number;
  totalSurveys: number;
  totalAlerts: number;
  activeRules: number;
  recentLogs: Array<{
    id: string;
    action: string;
    createdAt: Date;
    user: { fullName: string | null } | null;
  }>;
  primaria: number;
  secundaria: number;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">
          Panel del Administrador
        </h1>
        <p className="text-slate-600 mt-1">
          Configuración y gestión global del sistema
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Estudiantes activos"
          value={totalStudents}
          icon={<Users className="w-5 h-5" />}
          color="bg-brand-100 text-brand-700"
        />
        <StatCard
          label="Usuarios del sistema"
          value={totalUsers}
          icon={<Users className="w-5 h-5" />}
          color="bg-purple-100 text-purple-700"
        />
        <StatCard
          label="Encuestas creadas"
          value={totalSurveys}
          icon={<ClipboardList className="w-5 h-5" />}
          color="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          label="Alertas generadas"
          value={totalAlerts}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="bg-red-100 text-red-700"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <h2 className="font-semibold mb-4">
            Distribución de estudiantes
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-brand-50 border border-brand-100">
              <p className="text-xs text-slate-500">Primaria</p>
              <p className="text-3xl font-bold text-brand-700">
                {primaria}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-warm-50 border border-warm-100">
              <p className="text-xs text-slate-500">Secundaria</p>
              <p className="text-3xl font-bold text-warm-700">
                {secundaria}
              </p>
            </div>
          </div>

          <h3 className="font-semibold mt-6 mb-2">Acciones rápidas</h3>

          <div className="grid sm:grid-cols-3 gap-2">
            <Link href="/admin/importar" className="btn-secondary justify-start text-sm">
              <Upload className="w-4 h-4" /> Importar SIAGIE
            </Link>

            <Link href="/admin/reglas" className="btn-secondary justify-start text-sm">
              <ShieldAlert className="w-4 h-4" /> Reglas ({activeRules})
            </Link>

            <Link href="/admin/usuarios" className="btn-secondary justify-start text-sm">
              <Users className="w-4 h-4" /> Usuarios
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Actividad reciente
          </h2>

          <ul className="space-y-2 text-sm">
            {recentLogs.map((l) => (
              <li key={l.id} className="border-l-2 border-slate-200 pl-3">
                <p className="font-medium text-slate-900">{l.action}</p>
                <p className="text-xs text-slate-500">
                  {l.user?.fullName || 'Sistema'} ·{' '}
                  {l.createdAt.toLocaleString('es-PE')}
                </p>
              </li>
            ))}

            {recentLogs.length === 0 && (
              <li className="text-slate-500 text-xs">
                Sin registros aún.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="card !p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}