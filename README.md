# PsicoEscolar

Sistema de bienestar estudiantil para la **I.E. 40122 Manuel Scorza Torres**.

Plataforma web que permite al colegio:

- Aplicar encuestas periódicas de bienestar emocional a sus **548 estudiantes** (primaria y secundaria).
- Detectar automáticamente situaciones de riesgo mediante un motor de alertas configurable (palabras clave, combinación de respuestas, umbrales de score).
- Mantener seis perfiles diferenciados: estudiante, tutor, auxiliar, psicólogo, director y administrador, cada uno con su propio nivel de acceso.
- Importar la nómina anual desde Excel SIAGIE o planilla general y generar credenciales automáticamente.
- Exportar respuestas, credenciales y reportes a CSV/Excel.
- Soportar **estudiantes extranjeros** (CE, pasaporte u otro documento de 6–12 dígitos).
- Cumplir con la Ley N° 29733 de Protección de Datos Personales.

## Stack

- **Next.js 14** (App Router, Server Actions, API Routes)
- **TypeScript**
- **Prisma** + **PostgreSQL** — Neon (producción)
- **CSS Modules** con sistema editorial propio + **Tailwind CSS** (componentes base)
- **Fraunces** (serif titulares) + **Outfit** (texto), paleta verde esmeralda `#16a34a`
- **Recharts** para gráficos + **lucide-react** para iconos
- **JWT** en cookies httpOnly + **bcrypt** para contraseñas
- **ExcelJS** para importar/exportar
- Diseño **adaptativo** (PC y móvil) en todas las páginas
- Despliegue en **Vercel**

## Estructura

```
psicoescolar/
├── prisma/
│   ├── schema.prisma           # Modelo de datos
│   └── seed.ts                 # Datos iniciales
├── scripts/
│   ├── export-credentials.ts   # Exporta credenciales de todos los alumnos a CSV
│   ├── fix-foreign-passwords.ts# Fija contraseñas de estudiantes extranjeros
│   ├── fix-student-passwords.ts# Reset masivo de contraseñas de estudiantes
│   ├── seed-encuestas-anuncios.ts
│   └── seed-test-vocacional.ts
├── src/
│   ├── app/
│   │   ├── login/              # Landing + formulario de acceso
│   │   ├── estudiante/         # Panel estudiante
│   │   ├── psicologo/          # Panel psicólogo (encuestas, alertas, respuestas, estadísticas)
│   │   ├── tutor/              # Panel tutor
│   │   ├── auxiliar/           # Panel auxiliar
│   │   ├── director/           # Panel director
│   │   ├── admin/              # Panel admin (usuarios, auditoría, importación)
│   │   └── api/                # Endpoints REST (export, push notifications)
│   ├── lib/
│   │   ├── auth.ts             # JWT, sesiones, bcrypt
│   │   ├── prisma.ts           # Cliente Prisma singleton
│   │   ├── alert-engine.ts     # Motor de alertas (KEYWORD / COMBINATION / SCORE)
│   │   ├── siagie-importer.ts  # Importador Excel SIAGIE
│   │   ├── general-importer.ts # Importador Excel planilla general
│   │   ├── response-importer.ts# Importador de respuestas masivas
│   │   ├── excel-exporter.ts   # Exportador de respuestas
│   │   └── password.ts         # Hash / verify bcrypt
│   └── middleware.ts           # Protección de rutas por rol
```

## Inicio rápido (local)

### Requisitos

- Node.js 18.17+ o 20+
- npm 9+
- PostgreSQL local **o** cuenta gratuita en [Neon](https://neon.tech) / Supabase / Railway

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env: ajustar DATABASE_URL y JWT_SECRET

# 3. Crear las tablas en la base de datos
npm run db:push

# 4. Cargar datos iniciales (grados, secciones, usuarios demo)
npm run db:seed

# 5. Levantar el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Credenciales

### Staff — clave `demo1234`

| Usuario | Rol |
|---|---|
| admin@scorzatorres.edu.pe | Administrador |
| psicologo@scorzatorres.edu.pe | Psicólogo |
| director@scorzatorres.edu.pe | Director |
| auxiliar@scorzatorres.edu.pe | Auxiliar |
| tutor1a@scorzatorres.edu.pe | Tutor 1°A primaria |

### Estudiantes (todos)

> **Usuario** = número de documento (DNI o CE)  
> **Contraseña** = últimos 6 dígitos del documento (con ceros a la izquierda si tiene menos de 6)

| Documento | Usuario | Contraseña |
|---|---|---|
| `72345678` | `72345678` | `345678` |
| `006309627` | `006309627` | `309627` |
| `4812` | `4812` | `004812` |

> Para regenerar contraseñas de estudiantes extranjeros:
> ```bash
> npx tsx scripts/fix-foreign-passwords.ts
> ```

### Exportar credenciales de todos los alumnos

```bash
npx tsx scripts/export-credentials.ts
# Genera: scripts/credenciales-alumnos.csv
# Columnas: N° · Apellidos y Nombres · Nivel · Grado · Sección · Usuario · Contraseña · Apoderado · Celular
```

## Importación de alumnos

### Desde la interfaz web (recomendado)

**Admin → Importar SIAGIE:** selecciona el archivo `rptPadresFamiliaEstudiantes.xlsx`, el nivel y el año académico.

El sistema:
1. Lee el header en la fila 12 y los datos desde la fila 13.
2. Crea o actualiza usuarios y estudiantes según el DNI/CE.
3. Genera la clave inicial = últimos 6 dígitos del documento.
4. Carga datos del padre, madre y apoderado oficial.

**Admin → Importar alumnos (planilla general):** acepta un Excel con columnas:
`dni, apellido_paterno, apellido_materno, nombres, sexo, fecha_nacimiento, nivel, grado, seccion`

### Desde la línea de comandos

```bash
npm run import:siagie -- --file=./data/primaria.xlsx --nivel=PRIMARIA --anio=2026
npm run import:siagie -- --file=./data/secundaria.xlsx --nivel=SECUNDARIA --anio=2026
```

## Motor de alertas

Tres mecanismos en paralelo, configurables desde el panel del psicólogo:

1. **KEYWORD** — busca palabras o frases clave en respuestas de texto abierto.
2. **COMBINATION** — dispara cuando se cumple una combinación de respuestas.
3. **SCORE** — suma puntos por opción y dispara al superar un umbral.

Las reglas por defecto incluyen detección de palabras críticas (autolesión, ideación suicida, aislamiento). **Deben ser revisadas con el psicólogo antes de usar en producción.**

Las alertas son **silenciosas**: aparecen en la bandeja del psicólogo, quien decide si notificar al apoderado.

## Roles y permisos

| Rol | Acceso |
|---|---|
| **Estudiante** | Responde encuestas. Ve su propio historial, sin información de riesgo. |
| **Tutor** | Solo lectura, restringido a su(s) sección(es). Sin alertas. |
| **Auxiliar** | Solo lectura, todas las secciones. Sin alertas. |
| **Psicólogo** | Crea encuestas, ve respuestas identificadas, gestiona alertas, accede a histórico completo. |
| **Director** | Solo estadísticas agregadas y anonimizadas. Sin acceso a respuestas individuales. |
| **Admin** | Gestión de usuarios, importación SIAGIE, configuración de reglas, auditoría completa. |

## Privacidad y cumplimiento

- Aviso de privacidad en `/privacidad`, accesible desde la página de inicio.
- Registro de auditoría (`AuditLog`) para operaciones sensibles.
- Contraseñas almacenadas con **bcrypt** (salt rounds = 10).
- Sesiones por **JWT** en cookies `httpOnly + Secure + SameSite=Lax`.
- Cifrado en tránsito (HTTPS obligatorio en producción).

## Comandos útiles

```bash
npm run dev                  # Servidor de desarrollo
npm run build                # Build de producción
npm run start                # Iniciar build de producción
npm run db:push              # Aplicar schema sin migraciones
npm run db:migrate           # Crear migración formal
npm run db:seed              # Cargar datos iniciales
npm run db:studio            # Prisma Studio (GUI de la BD)
npm run import:siagie        # Importar Excel SIAGIE desde CLI

npx tsx scripts/export-credentials.ts      # Exportar credenciales a CSV
npx tsx scripts/fix-foreign-passwords.ts   # Regenerar claves de extranjeros
npx tsx scripts/fix-student-passwords.ts   # Reset masivo de contraseñas
```

## Licencia

Uso interno — I.E. 40122 Manuel Scorza Torres · Arequipa, Perú · 2026.
