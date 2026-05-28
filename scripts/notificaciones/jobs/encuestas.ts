import { PrismaClient }                  from '@prisma/client';
import { yaNotificado, marcarNotificado } from '../state';
import { sendMail }                       from '../mailer';
import { emailEncuesta }                  from '../templates';

const prisma = new PrismaClient();

export async function jobEncuestas(): Promise<void> {
  console.log('[Encuestas] Buscando encuestas nuevas activas…');

  const encuestas = await prisma.survey.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const nuevas = encuestas.filter(e => !yaNotificado('encuestas', e.id));
  if (nuevas.length === 0) { console.log('[Encuestas] Sin encuestas nuevas.\n'); return; }

  for (const encuesta of nuevas) {
    const targetGrades   = encuesta.targetGrades   as string[];
    const targetSections = encuesta.targetSections as string[];

    const whereStudent: Record<string, unknown> = { estadoMatricula: 'DEFINITIVA' };
    if (targetSections.length > 0)     whereStudent.sectionId = { in: targetSections };
    else if (targetGrades.length > 0)  whereStudent.section   = { gradeId: { in: targetGrades } };

    const estudiantes = await prisma.student.findMany({
      where: whereStudent as any,
      select: {
        nombres: true, apellidoPaterno: true, apellidoMaterno: true,
        apoderados: {
          where: { correo: { not: null } },
          select: { apellidosNombres: true, correo: true, esContactoPrincipal: true },
          orderBy: { esContactoPrincipal: 'desc' },
          take: 1,
        },
      },
    });

    console.log(`  Notificando: "${encuesta.title}" → ${estudiantes.length} estudiantes`);
    let enviados = 0;

    for (const est of estudiantes) {
      const ap = est.apoderados[0];
      if (!ap?.correo) continue;
      const tpl = emailEncuesta({
        apoderado:   ap.apellidosNombres,
        estudiante:  `${est.apellidoPaterno} ${est.apellidoMaterno}, ${est.nombres}`,
        titulo:      encuesta.title,
        descripcion: encuesta.description ?? undefined,
      });
      if (await sendMail({ to: ap.correo, ...tpl })) enviados++;
    }

    marcarNotificado('encuestas', encuesta.id);
    console.log(`  ✓ "${encuesta.title}" — ${enviados} enviados`);
  }
  console.log('[Encuestas] Listo.\n');
}
