# Manual de Usuario — Psicólogo
## PsicoEscolar · I.E. 40122 Manuel Scorza Torres

---

## Su rol en el sistema

El **psicólogo** es el usuario principal del sistema. Tiene acceso completo a toda la información clínica: respuestas de encuestas, niveles de riesgo, alertas, estadísticas predictivas y gestión del equipo de psicología. También puede publicar comunicados, crear y editar encuestas, y registrar nuevos estudiantes.

---

## Cómo ingresar

1. Abra el navegador e ingrese a la dirección del sistema.
2. Escriba su **usuario** (`psicologo@scorzatorres.edu.pe` o el asignado) y **contraseña**.
3. El sistema lo llevará a su panel de psicología.

---

## Panel de inicio (Dashboard)

Vista ejecutiva del estado del sistema:

### Indicadores principales

| Indicador | Descripción |
|-----------|-------------|
| Alertas pendientes | Alertas sin revisar que requieren atención |
| Encuestas activas | Encuestas en curso en este momento |
| Respuestas recibidas | Total de respuestas recibidas |
| Total alumnos | Número de estudiantes en el sistema |
| Tasa de respuesta | Porcentaje de alumnos que han respondido |

### Buscador de alumnos

La barra de búsqueda en el dashboard permite encontrar a cualquier estudiante rápidamente escribiendo su nombre o apellido.

### Gráficos

- **Distribución de riesgo:** cantidad de alumnos por nivel (BAJO / MEDIO / ALTO).
- **Tendencia por grado:** evolución del riesgo en los distintos grados.
- **Alertas recientes:** las últimas 6 alertas disparadas con acceso rápido.

---

## Encuestas

**Ruta:** Menú → Encuestas

### Lista de encuestas (acordeón)

Las encuestas se muestran en formato acordeón. Cada fila puede expandirse para ver detalles.

**Acciones por encuesta:**

| Botón | Acción |
|-------|--------|
| 👁 Ver | Abre los resultados detallados de la encuesta |
| ✏ Editar | Edita el título y descripción de la encuesta |
| ⏻ Activar/Desactivar | Activa o desactiva la encuesta para los alumnos |
| 🗑 Eliminar | Elimina la encuesta y todas sus respuestas |

La lista se pagina de 10 en 10.

### Editar una encuesta

1. Haga clic en el botón de lápiz (✏) de la encuesta.
2. El acordeón se abre con el formulario de edición.
3. Modifique el título y/o descripción.
4. Haga clic en **Guardar**.

> Solo se puede editar el título y descripción. Para modificar las preguntas es necesario crear una nueva encuesta.

### Ver resultados de una encuesta

Haga clic en **Ver** (👁) para acceder a la página de resultados que muestra:

- Estadísticas: respondieron, pendientes, tasa de respuesta %, alumnos de alto riesgo.
- **Filtros:** buscar por nombre, nivel, grado o sección.
- **Tabla "Respondieron":** paginada de 10 en 10 con nivel de riesgo, puntaje y fecha.
- **Tabla "Pendientes":** alumnos que aún no han respondido, paginados de 10 en 10.

---

## Crear nueva encuesta

**Ruta:** Menú → Encuestas → Nueva encuesta

### Constructor de encuesta

1. Escriba el **título** de la encuesta.
2. Añada una **descripción** (opcional).
3. Seleccione el **público objetivo:**
   - Todos los alumnos
   - Por nivel (Primaria / Secundaria)
   - Por grado específico
   - Por sección específica
4. Agregue preguntas con el botón **+ Agregar pregunta**.

### Tipos de pregunta

| Tipo | Cuándo usarlo |
|------|--------------|
| Opción única | Una sola respuesta posible entre varias opciones |
| Opción múltiple | El alumno puede marcar varias respuestas |
| Escala | Valores numéricos (p.ej. del 1 al 5) |
| Texto libre | El alumno escribe su respuesta |
| Sí / No | Pregunta binaria |

Para preguntas de opción única, múltiple y sí/no: defina las opciones y asigne un **puntaje de riesgo** (0–100) a cada una.

5. Haga clic en **Publicar encuesta** para que quede activa.

### Importar encuesta desde CSV

**Ruta:** Menú → Encuestas → Nueva encuesta → Importar desde CSV

1. Descargue la **plantilla CSV** de ejemplo.
2. Complete la plantilla con las preguntas y opciones.
3. Suba el archivo CSV.
4. Revise la vista previa y corrija errores si los hay.
5. Haga clic en **Importar**.

---

## Alertas

**Ruta:** Menú → Alertas

Las alertas se generan automáticamente cuando un alumno activa una regla de riesgo al responder una encuesta.

### Pestañas

| Pestaña | Contenido |
|---------|-----------|
| Pendientes | Alertas que requieren revisión |
| Revisadas | Alertas ya atendidas |
| Todas | Historial completo |

### Información por alerta

- Alumno, grado y sección
- Regla que se activó (nombre y severidad)
- Encuesta que originó la alerta
- Nivel de riesgo del alumno
- Fecha en que se disparó

### Atender una alerta

1. Haga clic en la alerta para ver el detalle.
2. Lea la respuesta del alumno que activó la alerta.
3. Haga clic en **Marcar como revisada** una vez atendida.
4. Si es necesario, acceda a la ficha del alumno desde el enlace en la alerta.

---

## Estudiantes

**Ruta:** Menú → Estudiantes

### Directorio con filtros

Busque y filtre estudiantes por:
- Nombre o apellido
- Nivel, grado, sección
- Nivel de riesgo (BAJO / MEDIO / ALTO)

La lista muestra 20 alumnos por página con el último nivel de riesgo de cada uno destacado con color.

### Registrar nuevo estudiante

**Ruta:** Menú → Estudiantes → Agregar (botón verde)

Formulario en tres secciones:

**Sección 1 — Ubicación académica**
- Seleccione Nivel → Grado → Sección (en cascada)

**Sección 2 — Datos del estudiante**
- DNI, apellido paterno, apellido materno, nombres
- Sexo, fecha de nacimiento

**Sección 3 — Apoderado / Contacto**
- Nombres del apoderado, parentesco
- Celular y/o correo (al menos uno es obligatorio para notificaciones)

Al registrar, el sistema genera automáticamente las credenciales:
- **Usuario:** DNI del estudiante
- **Contraseña temporal:** últimos 6 dígitos del DNI

Estas credenciales se muestran en pantalla y se pueden enviar al apoderado.

### Eliminar un estudiante

En la ficha del estudiante hay un botón **Eliminar** (rojo, esquina superior derecha). Requiere confirmación doble. Esta acción es irreversible y elimina también el usuario y sus respuestas.

### Ficha del estudiante

- Datos completos personales y académicos
- Contactos familiares con datos de apoderados
- Historial de encuestas con riesgo, puntaje y alertas
- Respuestas detalladas expandibles

---

## Respuestas

**Ruta:** Menú → Respuestas

Vista completa de todas las respuestas del sistema con filtros avanzados:

| Filtro | Opciones |
|--------|----------|
| Búsqueda | Nombre del estudiante |
| Encuesta | Filtrar por encuesta específica |
| Nivel de riesgo | BAJO / MEDIO / ALTO |
| Grado | Todos los grados |
| Sección | Por sección |
| Rango de fechas | Desde / Hasta |

### Exportar respuestas

Botón **Exportar** (esquina superior derecha):
- Seleccione formato: **Excel (.xlsx)** o **CSV**
- Los filtros aplicados se incluyen en la exportación
- El archivo se descarga automáticamente

---

## Comunicados

**Ruta:** Menú → Comunicados

Funciona igual que en el módulo de Director. Puede crear, publicar, ocultar y eliminar comunicados para los estudiantes.

---

## Estadísticas

**Ruta:** Menú → Estadísticas

Panel analítico avanzado:

| Indicador | Descripción |
|-----------|-------------|
| Cobertura semanal | % de alumnos que respondieron esta semana |
| Tasa de riesgo | % de alumnos con riesgo medio o alto |
| Alertas pendientes | Número sin revisar |
| Puntaje promedio | Media del puntaje de riesgo en el sistema |

### Gráficos disponibles

- **Distribución de riesgo:** porcentaje en BAJO / MEDIO / ALTO
- **Tendencia 7 días:** evolución del puntaje promedio diario
- **Indicadores conductuales:** ranking de los indicadores más frecuentes
- **Proyección de riesgo:** predicción para la próxima semana con porcentaje de confianza

---

## Gestión de equipo (solo psicólogo principal)

**Ruta:** Menú → Usuarios

> Esta sección solo es visible para el usuario `psicologo@scorzatorres.edu.pe`.

### Registrar nuevo psicólogo

1. Complete el formulario: nombre completo, usuario (correo), contraseña temporal.
2. Haga clic en **Crear psicólogo**.
3. El nuevo usuario podrá ingresar con las credenciales asignadas.

### Gestionar psicólogos existentes

| Acción | Descripción |
|--------|-------------|
| Desactivar | El usuario no puede ingresar hasta que se reactive |
| Activar | Reactiva una cuenta desactivada |
| Restablecer contraseña | Genera una contraseña temporal nueva |

---

## Cerrar sesión

Haga clic en su nombre en la barra superior y seleccione **Cerrar sesión**.

---

## Buenas prácticas

1. **Revise las alertas diariamente** al inicio de la jornada para detectar situaciones urgentes.
2. **Mantenga activa solo una encuesta por tema** para evitar la fatiga de los estudiantes.
3. **Registre el correo del apoderado** al crear estudiantes — es necesario para las notificaciones automáticas.
4. **Exporte reportes mensualmente** para el seguimiento institucional.
5. **Desactive encuestas cerradas** para que no aparezcan en el panel de los alumnos.

---

*Manual PsicoEscolar v1.0 — Mayo 2026*
