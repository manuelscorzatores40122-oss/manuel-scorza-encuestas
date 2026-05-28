/**
 * Plantillas de correo electrónico para las notificaciones.
 */

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

export interface MailTpl { subject: string; html: string; text: string }

/* ══ Credenciales ══════════════════════════════════════════ */

export function emailCredenciales(opts: {
  apoderado:  string;
  estudiante: string;
  usuario:    string;
  clave:      string;
}): MailTpl {
  return {
    subject: `PsicoEscolar — Credenciales de acceso de ${opts.estudiante}`,
    html: `
<!DOCTYPE html><html lang="es">
<body style="margin:0;padding:0;background:#f4f6f0;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border:1.5px solid #1c241a;">
    <div style="background:#1c241a;padding:24px 28px;">
      <p style="margin:0;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#16a34a;font-weight:700;">I.E. 40122 Manuel Scorza Torres</p>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:500;color:#f4f6f0;">PsicoEscolar</h1>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 16px;color:#1c241a;font-size:15px;">Estimado/a <strong>${opts.apoderado}</strong>,</p>
      <p style="margin:0 0 20px;color:#56605a;font-size:14px;line-height:1.6;">
        Su hijo/a <strong>${opts.estudiante}</strong> ya tiene acceso habilitado en el sistema PsicoEscolar.
      </p>
      <div style="border:1.5px solid #1c241a;margin-bottom:20px;">
        <div style="padding:12px 18px;border-bottom:1px solid rgba(28,36,26,.12);">
          <p style="margin:0;font-size:11px;color:#8a9089;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">Usuario</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:500;color:#1c241a;letter-spacing:.04em;">${opts.usuario}</p>
        </div>
        <div style="padding:12px 18px;">
          <p style="margin:0;font-size:11px;color:#8a9089;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">Contraseña temporal</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:500;color:#1c241a;letter-spacing:.08em;">${opts.clave}</p>
        </div>
      </div>
      <a href="${APP_URL}/login" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">
        Ingresar al sistema →
      </a>
      <p style="margin:20px 0 0;font-size:12px;color:#8a9089;line-height:1.5;">
        La contraseña puede cambiarse al iniciar sesión. Si tiene dudas, comuníquese con el área de Psicología.
      </p>
    </div>
    <div style="background:#fafaf7;border-top:1px solid rgba(28,36,26,.1);padding:14px 28px;">
      <p style="margin:0;font-size:11px;color:#8a9089;">Mensaje automático — PsicoEscolar · I.E. 40122 Manuel Scorza Torres</p>
    </div>
  </div>
</body></html>`,
    text: `PsicoEscolar — Credenciales de ${opts.estudiante}\n\nEstimado/a ${opts.apoderado},\n\nSu hijo/a ${opts.estudiante} ya tiene acceso al sistema.\n\nUsuario: ${opts.usuario}\nContraseña: ${opts.clave}\n\nIngrese en: ${APP_URL}/login`,
  };
}

/* ══ Anuncios ══════════════════════════════════════════════ */

export function emailAnuncio(opts: {
  apoderado: string;
  titulo:    string;
  contenido: string;
}): MailTpl {
  return {
    subject: `PsicoEscolar — ${opts.titulo}`,
    html: `
<!DOCTYPE html><html lang="es">
<body style="margin:0;padding:0;background:#f4f6f0;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border:1.5px solid #1c241a;">
    <div style="background:#1c241a;padding:24px 28px;">
      <p style="margin:0;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#16a34a;font-weight:700;">Nuevo anuncio</p>
      <h1 style="margin:8px 0 0;font-size:20px;font-weight:500;color:#f4f6f0;">${opts.titulo}</h1>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 16px;color:#1c241a;font-size:15px;">Estimado/a <strong>${opts.apoderado}</strong>,</p>
      <div style="border-left:3px solid #16a34a;padding:12px 16px;background:#f9fdf7;margin-bottom:20px;">
        <p style="margin:0;color:#1c241a;font-size:14px;line-height:1.7;white-space:pre-wrap;">${opts.contenido}</p>
      </div>
      <a href="${APP_URL}/login" style="display:inline-block;background:#1c241a;color:#f4f6f0;text-decoration:none;padding:12px 24px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">
        Ver en PsicoEscolar →
      </a>
    </div>
    <div style="background:#fafaf7;border-top:1px solid rgba(28,36,26,.1);padding:14px 28px;">
      <p style="margin:0;font-size:11px;color:#8a9089;">I.E. 40122 Manuel Scorza Torres · PsicoEscolar</p>
    </div>
  </div>
</body></html>`,
    text: `${opts.titulo}\n\nEstimado/a ${opts.apoderado},\n\n${opts.contenido}\n\nIngrese en: ${APP_URL}/login`,
  };
}

/* ══ Encuestas ═════════════════════════════════════════════ */

export function emailEncuesta(opts: {
  apoderado:   string;
  estudiante:  string;
  titulo:      string;
  descripcion?: string;
}): MailTpl {
  return {
    subject: `PsicoEscolar — Nueva encuesta: ${opts.titulo}`,
    html: `
<!DOCTYPE html><html lang="es">
<body style="margin:0;padding:0;background:#f4f6f0;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border:1.5px solid #1c241a;">
    <div style="background:#1c241a;padding:24px 28px;">
      <p style="margin:0;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#16a34a;font-weight:700;">Nueva encuesta disponible</p>
      <h1 style="margin:8px 0 0;font-size:20px;font-weight:500;color:#f4f6f0;">${opts.titulo}</h1>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 16px;color:#1c241a;font-size:15px;">Estimado/a <strong>${opts.apoderado}</strong>,</p>
      <p style="margin:0 0 20px;color:#56605a;font-size:14px;line-height:1.6;">
        Se ha habilitado una nueva encuesta para su hijo/a <strong>${opts.estudiante}</strong>.
        Por favor indíquele que la complete ingresando a su cuenta.
      </p>
      ${opts.descripcion ? `<div style="border-left:3px solid #534ab7;padding:12px 16px;background:#f8f7fd;margin-bottom:20px;"><p style="margin:0;color:#1c241a;font-size:14px;">${opts.descripcion}</p></div>` : ''}
      <a href="${APP_URL}/login" style="display:inline-block;background:#534ab7;color:#fff;text-decoration:none;padding:12px 24px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">
        Ir a la encuesta →
      </a>
    </div>
    <div style="background:#fafaf7;border-top:1px solid rgba(28,36,26,.1);padding:14px 28px;">
      <p style="margin:0;font-size:11px;color:#8a9089;">I.E. 40122 Manuel Scorza Torres · PsicoEscolar</p>
    </div>
  </div>
</body></html>`,
    text: `Nueva encuesta: ${opts.titulo}\n\nEstimado/a ${opts.apoderado},\n\nSu hijo/a ${opts.estudiante} tiene una nueva encuesta disponible.\n\nIngrese en: ${APP_URL}/login`,
  };
}
