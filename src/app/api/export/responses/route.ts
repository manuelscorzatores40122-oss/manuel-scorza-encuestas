import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { exportResponsesToExcel } from '@/lib/excel-exporter';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN']);
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const filters: any = {};
  if (sp.get('surveyId')) filters.surveyId = sp.get('surveyId')!;
  if (sp.get('gradoId')) filters.gradeId = sp.get('gradoId')!;
  if (sp.get('riesgo')) filters.riskLevel = sp.get('riesgo')!;
  if (sp.get('desde')) filters.desde = new Date(sp.get('desde')!);
  if (sp.get('hasta')) filters.hasta = new Date(sp.get('hasta')!);

  const buffer = await exportResponsesToExcel(filters);
  const filename = `respuestas-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
