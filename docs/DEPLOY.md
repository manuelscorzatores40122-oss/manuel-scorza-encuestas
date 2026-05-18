# Guía de despliegue en Vercel + Supabase

Esta guía te lleva desde cero hasta tener PsicoEscolar corriendo en producción con dominio HTTPS, base de datos PostgreSQL gestionada y backups automáticos. Tiempo estimado: **30–45 minutos**.

---

## Paso 1 — Crear la base de datos en Supabase

Supabase ofrece PostgreSQL administrado con plan gratuito (500 MB, suficiente para los 552 estudiantes).

1. Crea una cuenta en [https://supabase.com](https://supabase.com) (puedes usar tu cuenta de GitHub).
2. Click en **New Project**.
   - **Name:** `psicoescolar`
   - **Database Password:** genera una contraseña segura y **guárdala** — la necesitarás en el siguiente paso.
   - **Region:** elige la más cercana (`South America (São Paulo)` para Perú).
   - **Pricing Plan:** Free.
3. Espera 1–2 minutos a que el proyecto se aprovisione.
4. En el menú lateral ve a **Project Settings → Database → Connection string**.
5. Copia la URL en formato **URI** (modo `Connection pooling`, transaction). Se ve así:
   ```
   postgresql://postgres.xxxxxxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```
6. Reemplaza `[YOUR-PASSWORD]` por la contraseña que guardaste.
7. **Guárdala** — será el valor de `DATABASE_URL`.

> 💡 **Importante:** usa la cadena con `pooler` y puerto `6543` para producción serverless (Vercel). Si necesitas correr migraciones desde tu máquina local, puedes usar la conexión directa puerto `5432`.

---

## Paso 2 — Subir el código a GitHub

1. Crea un repositorio nuevo en GitHub (puede ser privado).
2. Desde la carpeta del proyecto:
   ```bash
   git init
   git add .
   git commit -m "Inicial"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/psicoescolar.git
   git push -u origin main
   ```

---

## Paso 3 — Desplegar en Vercel

1. Crea cuenta en [https://vercel.com](https://vercel.com) (puedes usar GitHub).
2. Click en **Add New… → Project**.
3. Importa el repositorio `psicoescolar`.
4. Vercel detectará Next.js automáticamente.
5. **Antes de hacer Deploy**, agrega las variables de entorno:

   | Variable             | Valor                                                                  |
   |----------------------|------------------------------------------------------------------------|
   | `DATABASE_URL`       | La URL de Supabase del Paso 1                                          |
   | `JWT_SECRET`         | Genera con `openssl rand -base64 32` o usa cualquier string >32 chars |
   | `NEXT_PUBLIC_APP_URL`| `https://psicoescolar.vercel.app` (lo ajustas después si usas dominio) |
   | `VAPID_SUBJECT`      | `mailto:bienestar@scorzatorres.edu.pe` o correo técnico del sistema   |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clave pública generada con `npx web-push generate-vapid-keys` |
   | `VAPID_PRIVATE_KEY`  | Clave privada generada con `npx web-push generate-vapid-keys`          |

6. Click en **Deploy**. El primer build tarda 2–4 minutos.

---

## Paso 4 — Inicializar la base de datos

Una vez desplegado, necesitas crear las tablas y cargar los datos iniciales.

**Opción A — desde tu máquina local (recomendado la primera vez):**

```bash
# En la carpeta del proyecto, con .env apuntando a la BD de Supabase:
npm install
npm run db:push        # crea las tablas
npm run db:seed        # carga grados, usuarios demo y reglas
```

**Opción B — desde el dashboard de Supabase:**

Ve al SQL Editor de Supabase y ejecuta el contenido del archivo de migración generado por `npx prisma migrate deploy` (más complejo, sólo si no puedes correr Node localmente).

---

## Paso 5 — Verificar el sistema

1. Abre `https://tu-proyecto.vercel.app`.
2. Inicia sesión con `admin@scorzatorres.edu.pe` / `demo1234`.
3. Cambia la clave del admin desde el panel **Usuarios → Resetear clave** (genera una nueva clave segura).
4. Repite con todos los usuarios demo, o desactívalos si vas a crear cuentas reales.

---

## Paso 6 — Cargar la nómina real desde SIAGIE

1. Inicia sesión como administrador.
2. Ve a **Importar SIAGIE**.
3. Sube `rptPadresFamiliaEstudiantes.xlsx` para primaria.
4. Repite con el archivo de secundaria.
5. Descarga el CSV de credenciales y entrégalas a los estudiantes.

---

## Paso 7 — (Opcional) Dominio personalizado

1. En Vercel: **Settings → Domains** → agrega `bienestar.scorzatorres.edu.pe` (o el dominio que uses).
2. Configura el registro CNAME en tu proveedor DNS apuntando a `cname.vercel-dns.com`.
3. Vercel emite el certificado SSL automáticamente.
4. Actualiza la variable de entorno `NEXT_PUBLIC_APP_URL` al nuevo dominio y haz redeploy.

---

## Paso 8 — Backups y monitoreo

### Backups automáticos en Supabase

- El plan Free incluye 1 día de Point-in-Time Recovery.
- Para mayor seguridad, programa un backup manual semanal:
  ```bash
  pg_dump "postgresql://..." > backup-$(date +%Y%m%d).sql
  ```
- O actualiza al plan Pro de Supabase ($25/mes) que incluye 7 días de PITR.

### Monitoreo

- Vercel muestra logs en tiempo real en **Project → Logs**.
- Supabase muestra queries lentas en **Database → Query Performance**.
- Revisa la página `/admin/auditoria` del propio sistema para auditar operaciones sensibles.

---

## Solución de problemas

### "Can't reach database server"
Verifica que `DATABASE_URL` esté bien copiado, sin espacios, y que Supabase no esté pausado (ocurre tras 7 días sin uso en plan Free).

### "JWT_SECRET is not set"
Ve a Vercel → Settings → Environment Variables y agrega `JWT_SECRET`. Luego haz redeploy.

### Login no funciona en producción
- Asegúrate de que el sitio se sirve por HTTPS (Vercel lo hace por defecto).
- Si cambiaste el dominio, actualiza `NEXT_PUBLIC_APP_URL`.

### Importar SIAGIE devuelve "Excel inválido"
Verifica que el archivo es un `.xlsx` exportado de SIAGIE con el reporte `rptPadresFamiliaEstudiantes`. El header debe estar en la fila 12.

---

## Costos estimados (referenciales 2026)

| Servicio | Plan Free | Plan recomendado producción |
|----------|-----------|-----------------------------|
| Vercel   | Gratis (Hobby) | Pro $20/mes (más incluye colaboradores) |
| Supabase | Gratis (500MB) | Pro $25/mes (8GB + backups 7 días) |

Para 552 estudiantes con encuesta semanal, el plan Free es **suficiente** durante varios años. Considera upgrade si el colegio crece o si necesitas backups extendidos.
