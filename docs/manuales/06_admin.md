# Manual de Usuario — Administrador del Sistema
## PsicoEscolar · I.E. 40122 Manuel Scorza Torres

---

## Su rol en el sistema

El **Administrador** tiene control total sobre la configuración y los datos del sistema. Gestiona usuarios de todos los roles, importa y exporta datos masivos de estudiantes, configura las reglas de alerta, revisa el log de auditoría y publica comunicados. Es el único rol que puede realizar operaciones estructurales en el sistema.

---

## Cómo ingresar

1. Abra el navegador e ingrese a la dirección del sistema.
2. Escriba su **usuario** y **contraseña** de administrador.
3. El sistema lo llevará al panel de administración.

---

## Panel de inicio

Vista ejecutiva del estado global del sistema:

### Indicadores

| Indicador | Descripción |
|-----------|-------------|
| Total estudiantes | Alumnos registrados en el sistema |
| Usuarios activos | Cuentas de personal activas |
| Encuestas | Total de encuestas creadas |
| Alertas sin revisar | Alertas pendientes de atención por Psicología |

### Distribución por nivel

Gráfico con la cantidad y porcentaje de alumnos en Primaria y Secundaria.

### Actividad reciente

Las últimas 8 acciones realizadas en el sistema con:
- Fecha y hora exacta
- Usuario que realizó la acción
- Tipo de acción (login, importación, creación de usuario, etc.)

---

## Gestión de usuarios

**Ruta:** Menú → Usuarios

### Buscar y filtrar usuarios

- **Búsqueda por texto:** nombre o correo institucional.
- **Filtro por rol:** Estudiante, Tutor, Auxiliar, Psicólogo, Director, Administrador.

Por defecto muestra solo usuarios de personal (no estudiantes). Active el filtro correspondiente para ver cuentas de alumnos.

### Información por usuario

| Campo | Descripción |
|-------|-------------|
| Usuario (login) | Correo o DNI de acceso |
| Nombre completo | Nombre del usuario |
| Rol | Función en el sistema |
| Estado | Activo / Inactivo |
| Último acceso | Fecha y hora del último ingreso |

### Acciones por usuario

| Acción | Descripción |
|--------|-------------|
| Activar / Desactivar | Habilita o bloquea el acceso del usuario |
| Editar | Modifica nombre, correo y rol |
| Restablecer contraseña | Genera una contraseña temporal nueva |

### Crear nuevo usuario de personal

> Los usuarios de estudiantes se crean desde el módulo de Psicología o mediante importación masiva.

1. Haga clic en **Nuevo usuario**.
2. Complete: nombre completo, usuario (correo institucional), rol, contraseña temporal.
3. Haga clic en **Crear**.
4. Entregue las credenciales al nuevo usuario de forma segura.

---

## Importar / Exportar estudiantes

**Ruta:** Menú → Importar / Exportar

### Importar estudiantes desde Excel (SIAGIE)

Permite cargar masivamente los datos de estudiantes exportados desde SIAGIE.

**Pasos:**

1. Haga clic en **Descargar plantilla** para obtener el formato correcto.
2. Complete la plantilla con los datos de los estudiantes (puede usar datos de SIAGIE).
3. Haga clic en **Seleccionar archivo** y elija el Excel completado.
4. El sistema mostrará una **vista previa** con los registros detectados.
5. Revise que los datos sean correctos (especialmente DNI, grado y sección).
6. Haga clic en **Importar** para cargar los registros.

**Columnas requeridas en la plantilla:**

| Columna | Descripción |
|---------|-------------|
| DNI | Número de DNI del alumno |
| APELLIDO_PATERNO | Primer apellido |
| APELLIDO_MATERNO | Segundo apellido |
| NOMBRES | Nombres completos |
| SEXO | M o F |
| FECHA_NACIMIENTO | Formato DD/MM/AAAA |
| NIVEL | PRIMARIA o SECUNDARIA |
| GRADO | Número del grado (1–6) |
| SECCIÓN | Letra de sección (A, B, C...) |
| AÑO_ACADEMICO | Año en curso (ej. 2026) |

> Los alumnos importados se crean con credenciales automáticas: **usuario = DNI**, **contraseña = últimos 6 dígitos del DNI**.

### Exportar estudiantes

Permite descargar la base completa de estudiantes con datos de apoderados.

**Filtros disponibles para exportar:**
- Nivel, grado, sección
- Estado de matrícula
- Año académico

**Formatos de exportación:**
- **Excel (.xlsx):** con estilos y columnas formateadas (recomendado)
- **CSV:** para procesamiento en otras herramientas

El archivo incluye datos del alumno, datos de cuenta (usuario, último acceso) y datos de padre, madre y apoderado por separado.

---

## Auditoría

**Ruta:** Menú → Auditoría

Registro completo de todas las acciones realizadas en el sistema.

### Sección 1: Respuestas de encuestas

Tabla con todas las respuestas registradas:
- Fecha, estudiante, grado/sección, encuesta, nivel de riesgo, puntaje
- Paginada para fácil navegación

### Sección 2: Actividad del sistema

Log cronológico de acciones del personal:

| Tipo de acción | Color | Ejemplos |
|----------------|-------|---------|
| Autenticación | Gris | LOGIN, LOGOUT |
| Usuarios | Azul | CREATE_USER, DEACTIVATE_USER |
| Datos | Verde | IMPORT_STUDENTS, CREATE_STUDENT |
| Encuestas | Morado | CREATE_SURVEY, DELETE_SURVEY |
| Comunicados | Naranja | CREATE_ANNOUNCEMENT |
| Alertas | Rojo | REVIEW_ALERT |

Cada registro muestra: fecha/hora exacta, usuario responsable, tipo de acción y detalle.

> Use la auditoría para investigar incidentes, verificar quién realizó una acción o hacer seguimiento del uso del sistema.

---

## Reglas de alerta

**Ruta:** Menú → Reglas de alerta

Las reglas determinan cuándo el sistema genera una alerta automáticamente al recibir la respuesta de un alumno. El psicólogo recibe estas alertas en su panel.

### Tipos de regla

**1. Detección de palabras clave**
Se activa cuando una respuesta de texto libre contiene palabras específicas.
- Ejemplo: si el alumno escribe "no quiero vivir", se dispara la alerta.
- Configure: palabra(s) clave, severidad (BAJA / MEDIA / ALTA / CRÍTICA).

**2. Combinación de respuestas**
Se activa cuando el alumno elige opciones específicas en preguntas determinadas.
- Ejemplo: si en la pregunta "¿Cómo te sientes?" elige "Muy mal" Y en "¿Duermes bien?" elige "Nunca".

**3. Umbral de puntaje acumulado**
Se activa cuando el puntaje total de riesgo supera un valor definido.
- Ejemplo: si el puntaje supera 70 puntos, alerta de nivel ALTO.

### Gestionar una regla

| Acción | Descripción |
|--------|-------------|
| Activar / Desactivar | Habilita o pausa la regla sin eliminarla |
| Editar | Modifica los criterios de la regla |
| Eliminar | Elimina la regla permanentemente |

> Coordine con el área de Psicología antes de modificar reglas activas para no interrumpir el protocolo de detección.

---

## Comunicados

**Ruta:** Menú → Comunicados

Gestión de anuncios institucionales. Funciona igual que en el módulo de Director:
- Crear, publicar, ocultar y eliminar comunicados.
- Seleccionar roles destinatarios (Estudiantes, Personal, etc.).

---

## Cerrar sesión

Haga clic en su nombre en la barra superior y seleccione **Cerrar sesión**.

---

## Tareas periódicas recomendadas

### Diariamente
- Revisar que el sistema esté operativo (verificar que usuarios puedan ingresar).

### Semanalmente
- Consultar el log de auditoría para detectar acciones inusuales.
- Verificar que no haya usuarios con acceso indebido.

### Al inicio de año escolar
1. Importar el padrón de estudiantes desde SIAGIE.
2. Crear cuentas de tutores nuevos y asignarles secciones.
3. Revisar y actualizar las reglas de alerta con Psicología.
4. Desactivar cuentas de personal que ya no labora en la institución.

### Al cierre de año
1. Exportar todos los datos de estudiantes y respuestas como respaldo.
2. Desactivar cuentas de alumnos egresados o retirados si aplica.

---

## Seguridad del sistema

- **Nunca comparta su contraseña** de administrador. Es la cuenta de mayor privilegio.
- Si sospecha que una cuenta fue comprometida, desactívela de inmediato desde **Gestión de usuarios**.
- El **JWT_SECRET** configurado en el servidor debe ser una cadena aleatoria de al menos 32 caracteres. Si necesita rotarlo, coordine con el equipo técnico (todos los usuarios deberán volver a iniciar sesión).
- Las contraseñas se almacenan cifradas (bcrypt). El sistema nunca guarda contraseñas en texto plano.

---

## Preguntas frecuentes

**¿Cómo creo cuentas para los tutores?**  
Menú → Usuarios → Nuevo usuario. Asigne el rol "Tutor" y coordine con el área académica para asignar las secciones correspondientes.

**¿Se puede recuperar información eliminada?**  
No. La eliminación de estudiantes, encuestas y respuestas es permanente. Exporte los datos antes de eliminar.

**¿Qué hago si un estudiante olvidó su contraseña?**  
El psicólogo puede restablecerla desde el módulo de Estudiantes. Si no tiene acceso, puede hacerlo desde Menú → Usuarios (busque el DNI del alumno).

**¿Puedo cambiar el rol de un usuario?**  
Sí, desde el botón Editar en Gestión de usuarios. Tenga precaución: cambiar el rol cambia inmediatamente qué información puede ver el usuario.

**¿Cómo agrego una nueva sección o grado?**  
Los grados y secciones se configuran directamente en la base de datos. Contacte al equipo técnico para modificaciones estructurales del currículo.

---

*Manual PsicoEscolar v1.0 — Mayo 2026*
