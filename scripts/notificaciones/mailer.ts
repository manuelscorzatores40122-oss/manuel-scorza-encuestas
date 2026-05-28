/**
 * Módulo de correo electrónico usando Nodemailer.
 * Lee la configuración SMTP de las variables de entorno.
 */

import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port:   Number(process.env.SMTP_PORT  ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });

  return transporter;
}

export interface MailOptions {
  to:      string;
  subject: string;
  html:    string;
  text:    string;
}

/** Envía un correo. Devuelve true si se envió correctamente. */
export async function sendMail(opts: MailOptions): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.warn('  [Mail] SMTP no configurado — omitiendo correo a', opts.to);
    return false;
  }

  try {
    await t.sendMail({
      from:    process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to:      opts.to,
      subject: opts.subject,
      html:    opts.html,
      text:    opts.text,
    });
    console.log(`  [Mail] ✓ Enviado a ${opts.to}`);
    return true;
  } catch (err) {
    console.error(`  [Mail] Error enviando a ${opts.to}:`, err);
    return false;
  }
}

/** Verifica la conexión SMTP al arrancar. */
export async function verifyMailer(): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.log('  [Mail] SMTP no configurado — el canal de email estará desactivado.');
    return;
  }
  try {
    await t.verify();
    console.log('✅  Email SMTP verificado correctamente.');
  } catch (err) {
    console.warn('⚠️   Email SMTP — error de conexión:', err);
  }
}
