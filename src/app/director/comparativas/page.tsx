import { prisma } from '@/lib/prisma';
import { FileText } from 'lucide-react';
import { GraficosComparativas } from './GraficosComparativas';

export default async function ComparativasDirector() {
  const responses = await prisma.response.findMany({
    include: {
      student: { include: { section: { include: { grade: true } } } },
    },
  });

  const data: Record<string, { nivel: string; total: number; alto: number; medio: number }> = {
    PRIMARIA: { nivel: 'Primaria', total: 0, alto: 0, medio: 0 },
    SECUNDARIA: { nivel: 'Secundaria', total: 0, alto: 0, medio: 0 },
  };

  for (const r of responses) {
    const n = r.student.section.grade.nivel;
    data[n].total++;
    if (r.riskLevel === 'HIGH') data[n].alto++;
    if (r.riskLevel === 'MID') data[n].medio++;
  }

  const compareData = Object.values(data);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <FileText className="w-6 h-6 text-brand-600" /> Comparativa primaria vs secundaria
      </h1>
      <p className="text-slate-600 text-sm">Datos completamente anonimizados.</p>
      <GraficosComparativas data={compareData} />
    </div>
  );
}
