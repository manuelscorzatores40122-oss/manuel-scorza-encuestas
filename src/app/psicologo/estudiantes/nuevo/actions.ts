'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';

export async function createStudentAction(formData: FormData) {
  const session = await requireRole(['PSYCHOLOGIST', 'ADMIN']);

  const dni             = (formData.get('dni')             as string)?.trim();
  const apellidoPaterno = (formData.get('apellidoPaterno') as string)?.trim().toUpperCase();
  const apellidoMaterno = (formData.get('apellidoMaterno') as string)?.trim().toUpperCase();
  const nombres         = (formData.get('nombres')         as string)?.trim().toUpperCase();
  const sexo            = formData.get('sexo') as 'M' | 'F';
  const fechaNacimiento = formData.get('fechaNacimiento') as string;
  const sectionId       = formData.get('sectionId') as string;
  const codigoEstudiante = (formData.get('codigoEstudiante') as string)?.trim() || null;

  // Apoderado
  const apNombres    = (formData.get('apNombres')    as string)?.trim();
  const apParentesco = (formData.get('apParentesco') as string) as 'PADRE' | 'MADRE' | 'APODERADO' | 'OTRO';
  const apCelular    = (formData.get('apCelular')    as string)?.trim() || null;
  const apCorreo     = (formData.get('apCorreo')     as string)?.trim().toLowerCase() || null;

  if (!dni || !apellidoPaterno || !apellidoMaterno || !nombres || !sexo || !fechaNacimiento || !sectionId) {
    return { ok: false as const, error: 'Faltan datos del estudiante' };
  }
  if (!apNombres || !apParentesco) {
    return { ok: false as const, error: 'Ingresa el nombre y parentesco del apoderado' };
  }
  if (!apCelular && !apCorreo) {
    return { ok: false as const, error: 'El apoderado debe tener al menos celular o correo' };
  }

  const existing = await prisma.user.findUnique({ where: { username: dni } });
  if (existing) return { ok: false as const, error: `Ya existe un estudiante con DNI ${dni}` };

  const dniExists = await prisma.student.findUnique({ where: { dni } });
  if (dniExists) return { ok: false as const, error: `Ya existe un estudiante con DNI ${dni}` };

  const birth = new Date(fechaNacimiento);
  const today = new Date();
  const edad  = today.getFullYear() - birth.getFullYear()
    - (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);

  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section) return { ok: false as const, error: 'Sección no encontrada' };

  await prisma.user.create({
    data: {
      username:     dni,
      role:         'STUDENT',
      fullName:     `${apellidoPaterno} ${apellidoMaterno}, ${nombres}`,
      passwordHash: await hashPassword(dni.slice(-6)),
      student: {
        create: {
          dni,
          codigoEstudiante: codigoEstudiante || undefined,
          apellidoPaterno,
          apellidoMaterno,
          nombres,
          sexo:            sexo === 'M' ? 'M' : 'F',
          fechaNacimiento: birth,
          edad,
          sectionId,
          estadoMatricula: 'DEFINITIVA',
          anioAcademico:   today.getFullYear(),
          apoderados: {
            create: {
              apellidosNombres:    apNombres,
              parentesco:          apParentesco,
              celular:             apCelular,
              correo:              apCorreo,
              esContactoPrincipal: true,
            },
          },
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: 'CREATE_STUDENT',
      entity: 'Student',
      metadata: { dni, nombres, sectionId, apCelular, apCorreo } as any,
    },
  });

  revalidatePath('/psicologo/estudiantes');
  return {
    ok: true as const,
    credenciales: {
      usuario:    dni,
      contrasena: dni.slice(-6),
      nombre:     `${apellidoPaterno} ${apellidoMaterno}, ${nombres}`,
      apoderado:  apNombres,
      celular:    apCelular,
      correo:     apCorreo,
    },
  };
}
