'use server';

import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function deleteStudentAction(studentId: string) {
  const session = await requireRole(['PSYCHOLOGIST', 'ADMIN']);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { userId: true, dni: true, nombres: true, apellidoPaterno: true },
  });
  if (!student) return { ok: false as const, error: 'Estudiante no encontrado' };

  // Eliminar el User elimina el Student por CASCADE
  await prisma.user.delete({ where: { id: student.userId } });

  await prisma.auditLog.create({
    data: {
      userId:   session.userId,
      action:   'DELETE_STUDENT',
      entity:   'Student',
      entityId: studentId,
      metadata: { dni: student.dni, nombre: `${student.apellidoPaterno} ${student.nombres}` } as any,
    },
  });

  redirect('/psicologo/estudiantes');
}
