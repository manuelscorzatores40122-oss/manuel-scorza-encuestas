'use server';

import { Parentesco, Sexo } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


const CONTACTS: Array<{ key: string; parentesco: Parentesco; principal?: boolean }> = [
  { key: 'padre', parentesco: Parentesco.PADRE },
  { key: 'madre', parentesco: Parentesco.MADRE },
  { key: 'apoderado', parentesco: Parentesco.APODERADO, principal: true },
];

export async function updateStudentProfileAction(formData: FormData) {
  const session = await requireRole(['STUDENT']);
  const student = await prisma.student.findUnique({ where: { userId: session.userId } });
  if (!student) return { ok: false as const, error: 'No se encontró tu ficha de estudiante.' };

  const existingContacts = await prisma.apoderado.findMany({
    where: {
      studentId: student.id,
      parentesco: { in: CONTACTS.map((contact) => contact.parentesco) },
    },
  });
  const existingByParentesco = new Map(existingContacts.map((contact) => [contact.parentesco, contact]));

  for (const contact of CONTACTS) {
    const name = String(formData.get(`${contact.key}.name`) || '').trim();
    const numeroDocumento = String(formData.get(`${contact.key}.document`) || '').trim();
    const correo = String(formData.get(`${contact.key}.email`) || '').trim();
    const celular = String(formData.get(`${contact.key}.phone`) || '').replace(/\s+/g, '').trim();
    const sexoRaw = String(formData.get(`${contact.key}.sexo`) || '').trim();

    if (!name && !numeroDocumento && !correo && !celular) continue;

    if (celular && !/^[0-9+()-]{6,20}$/.test(celular)) {
      return { ok: false as const, error: `Revisa el número celular de ${contact.key}.` };
    }

    const payload = {
      apellidosNombres: name || `${contact.parentesco} SIN NOMBRE`,
      numeroDocumento: numeroDocumento || null,
      tipoDocumento: numeroDocumento ? 'DNI' : null,
      correo: correo || null,
      celular: celular || null,
      sexo: parseSexo(sexoRaw),
      esContactoPrincipal: !!contact.principal,
    };

    const existing = existingByParentesco.get(contact.parentesco);

    if (existing) {
      await prisma.apoderado.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.apoderado.create({
        data: { ...payload, studentId: student.id, parentesco: contact.parentesco },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: 'UPDATE_STUDENT_PROFILE',
      entity: 'Student',
      entityId: student.id,
    },
  });

  revalidatePath('/estudiante');
  revalidatePath('/estudiante/perfil');
  return { ok: true as const };
}

function parseSexo(value: string): Sexo | null {
  if (value === 'M' || value === 'F') return value;
  return null;
}
