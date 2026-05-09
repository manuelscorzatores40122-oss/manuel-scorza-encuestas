# PsicoEscolar

Sistema de bienestar estudiantil para la **I.E. 40122 Manuel Scorza Torres**.

Plataforma web que permite al colegio:

- Aplicar encuestas periódicas de bienestar emocional a sus 552 estudiantes (primaria y secundaria).
- Detectar automáticamente situaciones de riesgo mediante un motor de alertas configurable (palabras clave, combinación de respuestas, umbrales de score).
- Mantener cinco perfiles diferenciados: estudiante, tutor, auxiliar, psicólogo, director y administrador, cada uno con su propio nivel de acceso.
- Importar la nómina anual desde Excel SIAGIE y generar credenciales automáticamente.
- Exportar respuestas y reportes a Excel.
- Cumplir con la Ley N° 29733 de Protección de Datos Personales.

## Stack

- **Next.js 14** (App Router, Server Actions, API Routes)
- **TypeScript**
- **Prisma** + **PostgreSQL** (Supabase recomendado)
- **Tailwind CSS** + **Recharts** + **lucide-react**
- **JWT** con cookies httpOnly + **bcrypt** para contraseñas
- **ExcelJS** para importar/exportar
- Despliegue en **Vercel**

## Estructura

```
psicoescolar/
├── prisma/
│   ├── schema.prisma        # Modelo de datos
│   └── seed.ts              # Datos iniciales
├── scripts/
│   └── import-siagie.ts     # Importador CLI
├── src/
│   ├── app/                 # Páginas Next.js (App Router)
│   │   ├── login/           # Login
│   │   ├── estudiante/      # Panel estudiante
│   │   ├── psicologo/       # Panel psicólogo
│   │   ├── tutor/           # Panel tutor
│   │   ├── auxiliar/        # Panel auxiliar
│   │   ├── director/        # Panel director
│   │   ├── admin/           # Panel admin
│   │   └── api/             # Endpoints REST
│   ├── components/          # Componentes UI compartidos
│   ├── lib/
│   │   ├── auth.ts          # JWT, sesiones, bcrypt
│   │   ├── prisma.ts        # Cliente Prisma
│   │   ├── alert-engine.ts  # Motor de alertas
│   │   ├── siagie-importer.ts
│   │   ├── excel-exporter.ts
│   │   └── utils.ts
│   └── middleware.ts        # Protección de rutas por rol
└── docs/
    ├── DEPLOY.md            # Guía detallada de deploy
    └── ROLES.md             # Permisos por rol
```

## Inicio rápido (local)

### Requisitos

- Node.js 18.17+ o 20+
- npm 9+
- PostgreSQL local **o** cuenta gratuita en Supabase / Neon / Railway

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env y ajusta DATABASE_URL y JWT_SECRET

# 3. Crear las tablas en la base de datos
npm run db:push

# 4. Cargar datos iniciales (grados, secciones, usuarios demo)
npm run db:seed

# 5. Levantar el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Credenciales demo

Todas las cuentas de staff usan la clave **`demo1234`**:

| Usuario                              | Rol           |
|--------------------------------------|---------------|
| admin@scorzatorres.edu.pe            | Administrador |
| psicologo@scorzatorres.edu.pe        | Psicólogo     |
| director@scorzatorres.edu.pe         | Director      |
| auxiliar@scorzatorres.edu.pe         | Auxiliar      |
| tutor1a@scorzatorres.edu.pe          | Tutor 1°A primaria |

Estudiantes demo (clave = últimos 6 dígitos del DNI):

| DNI       | Clave   | Grado              |
|-----------|---------|--------------------|
| 70000001  | 000001  | 1° A primaria      |
| 70000002  | 000002  | 3° B secundaria    |
| 70000003  | 000003  | 1° A secundaria    |

## Deploy a producción

Ver [`docs/DEPLOY.md`](./docs/DEPLOY.md) para la guía paso a paso de deploy en **Vercel + Supabase**.

## Importación SIAGIE

### Desde la interfaz web (recomendado)

Inicia sesión como administrador → menú **Importar SIAGIE** → selecciona el archivo `rptPadresFamiliaEstudiantes.xlsx`, el nivel y el año académico.

El sistema:

1. Lee el header en la fila 12 y los datos desde la fila 13.
2. Crea o actualiza usuarios y estudiantes según el DNI.
3. Crea la clave inicial = últimos 6 dígitos del DNI.
4. Carga datos del padre, madre y apoderado oficial.
5. Devuelve un Excel/CSV con las credenciales nuevas para entregar a los estudiantes.

### Desde la línea de comandos

```bash
npm run import:siagie -- --file=./data/primaria.xlsx --nivel=PRIMARIA --anio=2026
npm run import:siagie -- --file=./data/secundaria.xlsx --nivel=SECUNDARIA --anio=2026
```

## Motor de alertas

Tres mecanismos en paralelo, todos configurables desde el panel del administrador:

1. **KEYWORD** — busca palabras o frases clave en respuestas de texto abierto.
2. **COMBINATION** — dispara cuando se cumple una combinación específica de respuestas (ej. "estado emocional muy bajo" + "no tiene con quién hablar").
3. **SCORE** — suma puntos asignados a cada opción de respuesta y dispara al superar un umbral.

Las reglas por defecto incluyen detección de palabras críticas relacionadas con autolesión, ideación suicida y aislamiento emocional. **Pueden y deben ser revisadas con el psicólogo del colegio antes de usar el sistema en producción.**

Las alertas son **silenciosas**: aparecen en la bandeja del psicólogo, quien decide caso por caso si notificar al apoderado.

## Roles y permisos

| Rol           | Acceso                                                                                |
|---------------|---------------------------------------------------------------------------------------|
| **Estudiante** | Responde encuestas. Ve su propio historial, sin información de riesgo.                |
| **Tutor**     | Solo lectura, restringido a la(s) sección(es) que tiene asignadas. **Sin alertas.**   |
| **Auxiliar**  | Solo lectura, todas las secciones. **Sin alertas.**                                   |
| **Psicólogo** | Crea encuestas, ve respuestas identificadas, gestiona alertas, accede a histórico.    |
| **Director**  | Solo estadísticas agregadas y anonimizadas. No accede a respuestas individuales.       |
| **Admin**     | Gestión de usuarios, importación SIAGIE, configuración de reglas, auditoría.          |

## Privacidad y cumplimiento

- Aviso de privacidad en `/privacidad`, accesible desde el login.
- Auditoría de operaciones sensibles (`AuditLog`).
- Contraseñas almacenadas con bcrypt.
- Sesiones por JWT en cookies httpOnly + Secure.
- Cifrado en tránsito (HTTPS obligatorio en producción).

## Comandos útiles

```bash
npm run dev              # Servidor desarrollo
npm run build            # Build de producción
npm run start            # Iniciar build de producción
npm run db:push          # Aplicar schema sin migraciones
npm run db:migrate       # Crear migración (recomendado en prod)
npm run db:seed          # Cargar datos iniciales
npm run db:studio        # Prisma Studio (GUI de la BD)
npm run import:siagie    # Importar Excel SIAGIE desde CLI
```

## Licencia

Uso interno de la I.E. 40122 Manuel Scorza Torres.
