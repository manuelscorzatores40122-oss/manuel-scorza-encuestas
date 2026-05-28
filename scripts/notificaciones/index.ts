/**
 * PsicoEscolar — Servicio de Notificaciones por Email
 * ====================================================
 * Ejecuta desde scripts/notificaciones/:  npm start
 *
 * Al arrancar:
 *  1. Carga variables de entorno desde ../../.env (y .env local si existe)
 *  2. Verifica conexión SMTP
 *  3. Ejecuta los 3 jobs de inmediato
 *  4. Los programa en intervalos configurables
 */

import path   from 'path';
import dotenv from 'dotenv';
import cron   from 'node-cron';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { verifyMailer }   from './mailer';
import { jobCredenciales } from './jobs/credenciales';
import { jobAnuncios }     from './jobs/anuncios';
import { jobEncuestas }    from './jobs/encuestas';
import { estadoActual }    from './state';

const INTERVALO_CREDS     = Number(process.env.INTERVALO_CREDENCIALES ?? 5);
const INTERVALO_ANUNCIOS  = Number(process.env.INTERVALO_ANUNCIOS     ?? 10);
const INTERVALO_ENCUESTAS = Number(process.env.INTERVALO_ENCUESTAS    ?? 10);

function banner(): void {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  PsicoEscolar — Servicio de Notificaciones       ║');
  console.log('║  I.E. 40122 Manuel Scorza Torres                 ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Canal: Email`);
  console.log(`Intervalos:  Credenciales ${INTERVALO_CREDS} min  |  Anuncios ${INTERVALO_ANUNCIOS} min  |  Encuestas ${INTERVALO_ENCUESTAS} min`);
  const st = estadoActual();
  console.log(`Estado guardado:  ${st.credenciales.length} creds  |  ${st.anuncios.length} anuncios  |  ${st.encuestas.length} encuestas`);
  console.log('');
}

async function main(): Promise<void> {
  banner();

  await verifyMailer();

  console.log('▶  Ejecutando jobs iniciales…\n');
  await jobCredenciales();
  await jobAnuncios();
  await jobEncuestas();

  cron.schedule(`*/${INTERVALO_CREDS} * * * *`, async () => {
    console.log(`[${ts()}] Cron — Credenciales`);
    await jobCredenciales();
  });

  cron.schedule(`*/${INTERVALO_ANUNCIOS} * * * *`, async () => {
    console.log(`[${ts()}] Cron — Anuncios`);
    await jobAnuncios();
  });

  cron.schedule(`*/${INTERVALO_ENCUESTAS} * * * *`, async () => {
    console.log(`[${ts()}] Cron — Encuestas`);
    await jobEncuestas();
  });

  console.log('🟢  Servicio activo. Presiona Ctrl+C para detener.\n');
}

function ts(): string {
  return new Date().toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
