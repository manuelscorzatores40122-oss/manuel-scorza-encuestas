# PsicoEscolar — Servicio de Notificaciones por Email

Script autónomo que corre **fuera del servidor Next.js** y envía correos automáticos a los apoderados.

## Qué envía

| Job | Cuándo | A quién |
|-----|--------|---------|
| **Credenciales** | Estudiante nuevo registrado | Apoderados del alumno con correo |
| **Anuncios** | Nuevo anuncio publicado | Todos los apoderados con correo |
| **Encuestas** | Nueva encuesta activa | Apoderados de los alumnos del grado/sección objetivo |

---

## Requisitos previos

- Node.js 18 o superior
- Cuenta Gmail con "Contraseña de aplicación" configurada

---

## Instalación

```bash
cd scripts/notificaciones
npm install
```

---

## Configuración

```bash
cp .env.example .env
```

Edita `scripts/notificaciones/.env`:

```env
# URL pública de la app (para los links en los mensajes)
APP_URL="https://tu-app.vercel.app"

# SMTP — Gmail (usa "Contraseña de aplicación", no tu clave normal)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="bienestar@scorzatorres.edu.pe"
SMTP_PASS="xxxx xxxx xxxx xxxx"
SMTP_FROM="PsicoEscolar <bienestar@scorzatorres.edu.pe>"

# Intervalos de revisión en minutos
INTERVALO_CREDENCIALES="5"
INTERVALO_ANUNCIOS="10"
INTERVALO_ENCUESTAS="10"
```

### Obtener contraseña de aplicación Gmail

1. **Cuenta de Google → Seguridad → Verificación en 2 pasos** (activar si no está activa)
2. **Seguridad → Contraseñas de aplicaciones**
3. Crea una para "Correo" / "Otro dispositivo"
4. Copia la clave de 16 caracteres como `SMTP_PASS`

---

## Ejecución

```bash
cd scripts/notificaciones
npm start
```

### Ejecución en segundo plano (Linux)

```bash
# Con pm2 (recomendado)
npm install -g pm2
pm2 start "npm start" --name psicoescolar-notif --cwd /ruta/scripts/notificaciones
pm2 save
pm2 startup   # para arrancar automáticamente al reiniciar
```

---

## Estado de envíos

Los IDs ya notificados se guardan en `data/state.json`:

```json
{
  "credenciales": ["studentId1", "studentId2"],
  "anuncios":     ["announcementId1"],
  "encuestas":    ["surveyId1"]
}
```

Para **reenviar** un grupo, borra los IDs correspondientes del JSON (o borra el archivo para reenviar todo).

---

## Flujo completo

```
Estudiante registrado (app)
        │
        ▼
  [Job Credenciales] (cada 5 min)
        └── Email → correo del apoderado

Anuncio publicado (app)
        │
        ▼
  [Job Anuncios] (cada 10 min)
        └── Email → todos los apoderados con correo

Encuesta activada (app)
        │
        ▼
  [Job Encuestas] (cada 10 min)
        ├── Filtra por grado/sección objetivo
        └── Email → apoderado principal del alumno
```
