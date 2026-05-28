import { PrismaClient }                     from '@prisma/client';
import { yaNotificado, marcarNotificado }    from '../state';
import { sendMail }                          from '../mailer';
import { emailCredenciales }                 from '../templates';

const prisma = new PrismaClient();

function derivarClave(dni: string): string {
  const d = dni.replace(/\D/g, '');
  return d.length >= 6 ? d.slice(-6) : d.padStart(6, '0');
}

export async function jobCredenciales(): Promise<void> {
  console.log('[Credenciales] Buscando estudiantes nuevos sin notificar…');

  const estudiantes = await prisma.student.findMany({
    where: { estadoMatricula: 'DEFINITIVA' },
    select: {
      id: true, dni: true, nombres: true,
      apellidoPaterno: true, apellidoMaterno: true,
      apoderados: {
        where: { correo: { not: null } },
        select: { apellidosNombres: true, correo: true, esContactoPrincipal: true },
        orderBy: { esContactoPrincipal: 'desc' },
      },
    },
  });

  let enviados = 0;
  let omitidos = 0;

  for (const est of estudiantes) {
    if (yaNotificado('credenciales', est.id)) continue;

    if (est.apoderados.length === 0) {
      console.log(`  Omitido (sin correo): ${est.apellidoPaterno} ${est.nombres}`);
      omitidos++;
      continue;
    }

    const nombre = `${est.apellidoPaterno} ${est.apellidoMaterno}, ${est.nombres}`;
    const clave  = derivarClave(est.dni);
    let enviado  = false;

    for (const ap of est.apoderados) {
      const tpl = emailCredenciales({
        apoderado:  ap.apellidosNombres,
        estudiante: nombre,
        usuario:    est.dni,
        clave,
      });
      const ok = await sendMail({ to: ap.correo!, ...tpl });
      if (ok) enviado = true;
    }

    if (enviado) {
      marcarNotificado('credenciales', est.id);
      console.log(`  ✓ ${nombre}`);
      enviados++;
    }
  }

  console.log(`[Credenciales] Enviados: ${enviados} | Omitidos: ${omitidos}\n`);
}
