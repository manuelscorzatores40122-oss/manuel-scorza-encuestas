import { prisma }              from '@/lib/prisma';
import { ImportarGeneral }     from './ImportarGeneral';
import { ExportarEstudiantes } from './ExportarEstudiantes';

const sectHead: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: '#8a887f',
  paddingBottom: 9, borderBottom: '1px solid #d3d1c7',
  margin: '0 0 6px',
};
const sectDesc: React.CSSProperties = {
  fontSize: 13.5, color: '#52514c', margin: '0 0 16px', lineHeight: 1.55,
};

export default async function ImportarPage() {
  const [grades, sections, total] = await Promise.all([
    prisma.grade.findMany({ orderBy: [{ nivel: 'asc' }, { order: 'asc' }] }),
    prisma.section.findMany({ orderBy: { name: 'asc' } }),
    prisma.student.count(),
  ]);

  return (
    <div style={{ fontSize: 15, color: '#1a1a18', maxWidth: 780 }}>

      {/* ── Encabezado ── */}
      <header style={{ paddingBottom: 18, borderBottom: '2px solid #1a1a18' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8a887f', margin: '0 0 10px' }}>
          Panel · Administrador
        </p>
        <h1 style={{ fontFamily: "var(--font-fraunces,'Fraunces',Georgia,serif)", fontSize: 34, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.02, margin: 0, color: '#1a1a18' }}>
          Importar y exportar
        </h1>
      </header>
      <div style={{ height: 4, width: 64, background: '#1a1a18', margin: '0 0 36px' }} />

      {/* ── Importar ── */}
      <section style={{ marginBottom: 40 }}>
        <p style={sectHead}>Importar · Excel / CSV</p>
        <p style={sectDesc}>
          Sube un archivo con tus datos.{' '}
          Descarga la plantilla para ver el formato exacto.
        </p>
        <ImportarGeneral />
      </section>

      <div style={{ height: 1, background: '#e4e2da', margin: '0 0 40px' }} />

      {/* ── Exportar ── */}
      <section>
        <p style={sectHead}>Exportar estudiantes</p>
        <p style={sectDesc}>
          Descarga todos los datos del sistema. Filtra por nivel, grado, sección
          o estado antes de generar el archivo.
        </p>
        <ExportarEstudiantes
          grades={grades.map(g => ({ id: g.id, name: g.name, nivel: g.nivel, order: g.order }))}
          sections={sections.map(s => ({ id: s.id, name: s.name, gradeId: s.gradeId }))}
          total={total}
        />
      </section>
    </div>
  );
}
