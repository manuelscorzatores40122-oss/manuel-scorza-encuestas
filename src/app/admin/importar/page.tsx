import { prisma }            from '@/lib/prisma';
import { ImportarGeneral }   from './ImportarGeneral';
import { ExportarEstudiantes } from './ExportarEstudiantes';

export default async function ImportarPage() {
  const [grades, sections, total] = await Promise.all([
    prisma.grade.findMany({ orderBy: [{ nivel: 'asc' }, { order: 'asc' }] }),
    prisma.section.findMany({ orderBy: { name: 'asc' } }),
    prisma.student.count(),
  ]);

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-bold">Importar y exportar alumnos</h1>
        <p className="text-slate-500 text-sm mt-1">
          Carga nóminas desde Excel/CSV o descarga los datos completos del sistema.
        </p>
      </header>

      {/* ── IMPORTAR ── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Importar · Excel / CSV</h2>
          <p className="text-slate-500 text-sm">
            Sube un archivo con tus datos. Descarga la plantilla para ver el formato exacto.
          </p>
        </div>
        <ImportarGeneral />
      </section>

      <hr className="border-slate-200" />

      {/* ── EXPORTAR ── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Exportar estudiantes</h2>
          <p className="text-slate-500 text-sm">
            Descarga todos los datos del sistema. Filtra por nivel, grado, sección o estado
            antes de generar el archivo.
          </p>
        </div>
        <ExportarEstudiantes
          grades={grades.map(g => ({ id: g.id, name: g.name, nivel: g.nivel, order: g.order }))}
          sections={sections.map(s => ({ id: s.id, name: s.name, gradeId: s.gradeId }))}
          total={total}
        />
      </section>
    </div>
  );
}
