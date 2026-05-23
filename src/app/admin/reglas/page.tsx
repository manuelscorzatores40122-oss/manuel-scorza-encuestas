import { prisma } from '@/lib/prisma';
import { EditorReglas } from './EditorReglas';

export default async function ReglasPage() {
  const rules = await prisma.alertRule.findMany({ orderBy: { createdAt: 'asc' } });

  return (
    <div style={{ fontSize: 15, color: '#1a1a18' }}>

      {/* ── Encabezado ── */}
      <header style={{ paddingBottom: 18, borderBottom: '2px solid #1a1a18' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8a887f', margin: '0 0 10px' }}>
          Panel · Administrador
        </p>
        <h1 style={{ fontFamily: "var(--font-fraunces,'Fraunces',Georgia,serif)", fontSize: 34, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.02, margin: 0, color: '#1a1a18' }}>
          Reglas de alerta
        </h1>
      </header>
      <div style={{ height: 4, width: 64, background: '#1a1a18', margin: '0 0 36px' }} />

      <p style={{ fontSize: 13.5, color: '#52514c', margin: '0 0 28px', lineHeight: 1.6 }}>
        Tres mecanismos en paralelo: palabras clave en texto abierto, combinaciones de respuestas y umbrales de score acumulado.
      </p>

      <EditorReglas rules={rules.map((r) => ({
        id: r.id, name: r.name, type: r.type, severity: r.severity,
        config: r.config as any, isActive: r.isActive,
      }))} />
    </div>
  );
}
