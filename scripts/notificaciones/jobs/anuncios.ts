import { PrismaClient }                  from '@prisma/client';
import { yaNotificado, marcarNotificado } from '../state';
import { sendMail }                       from '../mailer';
import { emailAnuncio }                   from '../templates';

const prisma = new PrismaClient();

export async function jobAnuncios(): Promise<void> {
  console.log('[Anuncios] Buscando anuncios nuevos…');

  const anuncios = await prisma.announcement.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const nuevos = anuncios.filter(a => !yaNotificado('anuncios', a.id));
  if (nuevos.length === 0) { console.log('[Anuncios] Sin anuncios nuevos.\n'); return; }

  // Apoderados con correo, deduplicados
  const apoderados = await prisma.apoderado.findMany({
    where: { correo: { not: null } },
    select: { apellidosNombres: true, correo: true, esContactoPrincipal: true },
    orderBy: { esContactoPrincipal: 'desc' },
  });
  const unicos = new Map<string, typeof apoderados[0]>();
  for (const a of apoderados) {
    if (a.correo && !unicos.has(a.correo)) unicos.set(a.correo, a);
  }

  for (const anuncio of nuevos) {
    const roles = anuncio.targetRoles as string[];
    const aplica = roles.length === 0 || roles.includes('STUDENT') || roles.includes('AUXILIAR');
    if (!aplica) { marcarNotificado('anuncios', anuncio.id); continue; }

    console.log(`  Notificando: "${anuncio.title}" → ${unicos.size} correos`);
    let enviados = 0;
    for (const [, ap] of unicos) {
      const tpl = emailAnuncio({ apoderado: ap.apellidosNombres, titulo: anuncio.title, contenido: anuncio.content });
      if (await sendMail({ to: ap.correo!, ...tpl })) enviados++;
    }
    marcarNotificado('anuncios', anuncio.id);
    console.log(`  ✓ "${anuncio.title}" — ${enviados} enviados`);
  }
  console.log('[Anuncios] Listo.\n');
}
