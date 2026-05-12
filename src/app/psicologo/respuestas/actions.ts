'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { importSurveyResponsesExcel } from '@/lib/response-importer';
import { prisma } from '@/lib/prisma';

export async function importResponsesExcelAction(formData: FormData) {
  const session = await requireRole(['PSYCHOLOGIST']);
  const file = formData.get('file') as File | null;
  const surveyId = String(formData.get('surveyId') || '');

  if (!surveyId) {
    return { ok: false as const, error: 'Selecciona una encuesta' };
  }

  if (!file) {
    return { ok: false as const, error: 'Selecciona un archivo Excel' };
  }

  if (!/\.(xlsx|xls)$/i.test(file.name)) {
    return { ok: false as const, error: 'El archivo debe ser .xlsx o .xls' };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importSurveyResponsesExcel(buffer, surveyId);

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'IMPORT_SURVEY_RESPONSES',
        entity: 'Response',
        metadata: {
          surveyId,
          total: result.total,
          importados: result.importados,
          omitidos: result.omitidos,
          errores: result.errores.length,
        } as any,
      },
    });

    revalidatePath('/psicologo/respuestas');
    revalidatePath('/psicologo/alertas');
    revalidatePath('/psicologo/estadisticas');

    return { ok: true as const, result };
  } catch (error: any) {
    return {
      ok: false as const,
      error: error.message || 'Error al importar respuestas',
    };
  }
}
