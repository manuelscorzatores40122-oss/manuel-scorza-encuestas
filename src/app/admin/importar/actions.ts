'use server';

import { Nivel } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { importSiagieExcel } from '@/lib/siagie-importer';
import { importStudentsGeneral } from '@/lib/general-importer';
import { prisma } from '@/lib/prisma';

export async function importSiagieAction(formData: FormData) {
  const session = await requireRole(['ADMIN']);

  const file = formData.get('file') as File | null;
  const nivel = formData.get('nivel') as Nivel;
  const anio = Number(formData.get('anio'));

  if (!file) return { ok: false as const, error: 'No se subió archivo' };
  if (!nivel) return { ok: false as const, error: 'Falta nivel' };

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await importSiagieExcel(buffer, nivel, anio);
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'IMPORT_SIAGIE',
        entity: 'Student',
        metadata: { nivel, anio, total: result.total, creados: result.creados, actualizados: result.actualizados, errores: result.errores.length } as any,
      },
    });
    return { ok: true as const, result };
  } catch (e: any) {
    return { ok: false as const, error: e.message || 'Error al procesar el Excel' };
  }
}

export async function importGeneralAction(formData: FormData) {
  const session = await requireRole(['ADMIN']);

  const file = formData.get('file') as File | null;
  const anio = Number(formData.get('anio')) || new Date().getFullYear();

  if (!file) return { ok: false as const, error: 'No se subió archivo' };

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await importStudentsGeneral(buffer, file.name, anio);
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'IMPORT_GENERAL',
        entity: 'Student',
        metadata: { anio, total: result.total, creados: result.creados, actualizados: result.actualizados, errores: result.errores.length } as any,
      },
    });
    return { ok: true as const, result };
  } catch (e: any) {
    return { ok: false as const, error: e.message || 'Error al procesar el archivo' };
  }
}
