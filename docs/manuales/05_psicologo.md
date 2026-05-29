# Manual de Usuario — Psicólogo
## PsicoEscolar · I.E. 40122 Manuel Scorza Torres

---

## Su rol en el sistema

El **psicólogo** es el usuario principal del sistema. Tiene acceso completo a toda la información clínica: respuestas de encuestas, niveles de riesgo, alertas, estadísticas predictivas y gestión del equipo de psicología. También puede publicar comunicados, crear y editar encuestas (incluidas las preguntas), y registrar nuevos estudiantes.

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

Las encuestas se muestran en formato acordeón paginado de **10 en 10**. Haga clic en el título para expandir y ver el detalle de cada encuesta.

**Botones de acción por encuesta (visibles siempre en la cabecera):**

| Botón | Acción |
|-------|--------|
| 👁 Ver resultados | Abre la página de resultados con tablas paginadas |
| ✏ Lápiz | Edita el **título y descripción** (se abre dentro del acordeón) |
| ⏻ Activar / Desactivar | Activa o desactiva la encuesta para los alumnos |
| 🗑 Eliminar | Elimina la encuesta y todas sus respuestas (pide confirmación) |

**Dentro del acordeón expandido** aparecen dos enlaces adicionales:

| Enlace | Acción |
|--------|--------|
| Ver resultados → | Accede a la página de resultados de esa encuesta |
| Editar preguntas → | Abre el editor completo de preguntas de la encuesta |

---

### Editar título y descripción

1. Haga clic en el botón de lápiz (✏) en la cabecera de la encuesta.
2. El acordeón se abre mostrando el formulario de edición.
3. Modifique el **título** y/o la **descripción**.
4. Haga clic en **Guardar**.

---

### Editar preguntas de una encuesta

**Ruta:** Acordeón → Expandir encuesta → **Editar preguntas →**

Abre una página completa con el editor de preguntas donde puede:

- **Cambiar el texto** de cualquier pregunta existente.
- **Modificar las opciones** y sus puntajes de riesgo.
- **Agregar nuevas preguntas** de cualquier tipo usando los botones de la parte superior.
- **Reordenar** las preguntas con los botones ↑ ↓.
- **Eliminar** preguntas (si una pregunta ya tiene respuestas asociadas, no se borrará del historial aunque la retire).

> **Nota importante:** Si la encuesta ya tiene respuestas enviadas, aparecerá un aviso naranja. Puede editar los textos sin problema, pero las preguntas con respuestas asociadas no se eliminarán del sistema para no perder el historial.

**Tipos de pregunta disponibles:**

| Tipo | Cuándo usarlo |
|------|--------------|
| Selección única | Una sola respuesta entre varias opciones |
| Selección múltiple | El alumno puede marcar varias respuestas |
| Escala 1–5 | Valores numéricos del 1 al 5 |
| Texto abierto | El alumno escribe libremente |
| Sí / No | Pregunta binaria |

Para cada opción de respuesta asigne un **puntaje de riesgo (0–100)**. Este puntaje se acumula al responder y activa alertas automáticamente según las reglas configuradas.

**Al terminar**, haga clic en **Guardar preguntas**. El sistema regresa automáticamente a la lista de encuestas.

---

### Ver resultados de una encuesta

Haga clic en **Ver** (👁) o en **Ver resultados →** dentro del acordeón.

La página de resultados muestra:

- **Estadísticas:** respondieron, pendientes, tasa de respuesta %, alumnos de alto riesgo.
- **Filtros:** buscar por nombre de alumno, nivel, grado o sección.
- **Tabla "Respondieron":** paginada de **10 en 10** con nivel de riesgo, puntaje de riesgo y fecha.
- **Tabla "Pendientes":** alumnos que aún no han respondido, paginada de **10 en 10**.

---

## Encuestas preconfiguradas en el sistema

El sistema viene con **9 encuestas listas** para usar. Solo necesita **activarlas** cuando las necesite — los alumnos solo ven las encuestas activas.

| # | Encuesta | Estado inicial | Tema |
|---|----------|---------------|------|
| 1 | Bienestar semanal | **Activa** | Seguimiento emocional semanal general |
| 2 | Detección de Acoso Escolar (Bullying) | Inactiva | Agresiones, exclusión, ciberbullying |
| 3 | Entorno Familiar y Bienestar en Casa | Inactiva | Ambiente familiar, necesidades básicas |
| 4 | Detección de Depresión y Desesperanza | Inactiva | Indicadores depresivos (basada en PHQ-A) |
| 5 | Ansiedad y Estrés Escolar | Inactiva | Presión académica, síntomas físicos |
| 6 | Autoestima y Valoración Personal | Inactiva | Autoimagen, autoconcepto |
| 7 | Relaciones Sociales y Sentido de Pertenencia | Inactiva | Soledad, exclusión, vínculos con pares |
| 8 | Tecnología, Redes Sociales y Bienestar Digital | Inactiva | Uso problemático, ciberbullying digital |
| 9 | Proyecto de Vida y Motivación Escolar | Inactiva | Abandono escolar, metas, motivación |

**Para activar una encuesta:**
1. Vaya a Menú → Encuestas.
2. Encuentre la encuesta deseada en el acordeón.
3. Haga clic en el botón **⏻ (Activar)**.
4. La encuesta aparecerá de inmediato en el panel de todos los alumnos del público objetivo.

> **Recomendación:** active una sola encuesta por tema a la vez para no saturar a los estudiantes.

---

## Crear nueva encuesta

**Ruta:** Menú → Encuestas → **Nueva encuesta**

### Constructor de encuesta

1. Escriba el **título** de la encuesta.
2. Añada una **descripción** (opcional, visible para el alumno).
3. Seleccione el **público objetivo:**
   - Sin filtro → aparece para todos los alumnos activos
   - Por nivel (Primaria / Secundaria)
   - Por grado específico
   - Por sección específica
4. Agregue preguntas con los botones de tipo en la parte superior.
5. Para cada pregunta, escriba el texto, marque si es obligatoria y asigne puntaje de riesgo a las opciones.
6. Haga clic en **Guardar encuesta** para publicarla.

### Importar encuesta desde CSV

**Ruta:** Menú → Encuestas → Nueva encuesta → **Importar desde CSV**

1. Descargue la **plantilla CSV** de ejemplo.
2. Complete la plantilla con sus preguntas y opciones.
3. Suba el archivo CSV al sistema.
4. Revise la vista previa y corrija errores si los hubiera.
5. Haga clic en **Importar**.

---

## Alertas

**Ruta:** Menú → Alertas

Las alertas se generan automáticamente cuando un alumno activa una regla de riesgo al responder una encuesta.

### Sistema de puntajes y alertas automáticas

Cada opción de respuesta tiene un puntaje de riesgo (0–100). Al enviar una encuesta, el sistema suma todos los puntajes:

| Puntaje total | Nivel | Acción automática |
|--------------|-------|-------------------|
| 0–7 | BAJO | Sin alerta |
| 8–11 | MEDIO | Alerta de severidad MEDIA |
| 12 o más | ALTO | Alerta de severidad ALTA |

Algunas respuestas críticas (como indicar pensamientos de autolesión) generan alerta ALTA por sí solas, independientemente del puntaje total.

### Pestañas

| Pestaña | Contenido |
|---------|-----------|
| Pendientes | Alertas que requieren revisión |
| Revisadas | Alertas ya atendidas |
| Todas | Historial completo |

### Atender una alerta

1. Haga clic en la alerta para ver el detalle.
2. Lea la respuesta del alumno y la regla que se activó.
3. Acceda a la ficha del alumno desde el enlace en la alerta si necesita más contexto.
4. Haga clic en **Marcar como revisada** una vez atendida.

---

## Estudiantes

**Ruta:** Menú → Estudiantes

### Directorio con filtros

Busque y filtre por nombre o apellido, nivel, grado, sección o nivel de riesgo. La lista muestra 20 alumnos por página con el último nivel de riesgo destacado con color.

### Registrar nuevo estudiante

**Ruta:** Menú → Estudiantes → **Agregar** (botón verde superior derecho)

El formulario tiene tres secciones:

**1 — Ubicación académica**
Seleccione Nivel → Grado → Sección (los selectores se actualizan en cascada).

**2 — Datos del estudiante**
DNI, apellidos, nombres, sexo y fecha de nacimiento.

**3 — Apoderado / Contacto**
Nombre del apoderado, parentesco, celular y/o correo electrónico.
Al menos uno (celular o correo) es obligatorio para que funcionen las notificaciones automáticas.

Al registrar, el sistema genera las credenciales automáticamente:
- **Usuario:** DNI del estudiante
- **Contraseña temporal:** últimos 6 dígitos del DNI

Las credenciales se muestran en pantalla al finalizar el registro.

### Eliminar un estudiante

En la ficha del estudiante, botón **Eliminar** (rojo, esquina superior derecha). Requiere confirmación doble. Acción irreversible — elimina el usuario, sus respuestas y sus alertas asociadas.

### Ficha del estudiante

- Datos personales y académicos completos
- Lista de apoderados y contactos
- Historial de encuestas con nivel de riesgo, puntaje y alertas disparadas
- Respuestas detalladas expandibles pregunta por pregunta

---

## Respuestas

**Ruta:** Menú → Respuestas

Vista de todas las respuestas del sistema con filtros avanzados:

| Filtro | Opciones |
|--------|----------|
| Búsqueda | Nombre del estudiante |
| Encuesta | Filtrar por encuesta específica |
| Nivel de riesgo | BAJO / MEDIO / ALTO |
| Grado | Todos los grados |
| Sección | Por sección |

### Exportar respuestas

Botón **Exportar** (esquina superior derecha):
- Seleccione formato: **Excel (.xlsx)** o **CSV**
- Los filtros aplicados se incluyen en la exportación
- El archivo se descarga automáticamente

---

## Comunicados

**Ruta:** Menú → Comunicados

Cree, publique, oculte y elimine avisos para los estudiantes. Los comunicados publicados aparecen en el panel de inicio de todos los alumnos del público objetivo.

---

## Estadísticas

**Ruta:** Menú → Estadísticas

| Indicador | Descripción |
|-----------|-------------|
| Cobertura semanal | % de alumnos que respondieron esta semana |
| Tasa de riesgo | % de alumnos con riesgo medio o alto |
| Alertas pendientes | Número sin revisar |
| Puntaje promedio | Media del puntaje de riesgo del sistema |

### Gráficos disponibles

- **Distribución de riesgo:** porcentaje en BAJO / MEDIO / ALTO
- **Tendencia 7 días:** evolución del puntaje promedio diario
- **Indicadores conductuales:** ranking de los indicadores más frecuentes
- **Proyección de riesgo:** predicción para la próxima semana con porcentaje de confianza

---

## Gestión del equipo de psicología

**Ruta:** Menú → Usuarios

> Esta sección solo es visible para el usuario `psicologo@scorzatorres.edu.pe` (psicólogo principal).

### Registrar nuevo psicólogo

1. Complete el formulario: nombre completo, correo institucional, contraseña temporal.
2. Haga clic en **Crear psicólogo**.
3. El nuevo usuario podrá ingresar con esas credenciales.

### Gestionar psicólogos existentes

| Acción | Descripción |
|--------|-------------|
| Desactivar | Bloquea el acceso del usuario sin eliminarlo |
| Activar | Reactiva una cuenta desactivada |
| Restablecer contraseña | Genera una nueva contraseña temporal |

---

## Cerrar sesión

Haga clic en su nombre en la barra superior y seleccione **Cerrar sesión**.

---

## Buenas prácticas

1. **Revise las alertas diariamente** al inicio de la jornada — priorice las de severidad ALTA.
2. **Active una encuesta a la vez por tema** para evitar la fatiga de respuesta en los alumnos.
3. **Registre siempre el correo o celular del apoderado** al crear un estudiante — sin este dato no llegarán las notificaciones automáticas.
4. **Use las encuestas preconfiguradas** como base y edite las preguntas si necesita adaptarlas al contexto del aula.
5. **Exporte reportes mensualmente** (Menú → Respuestas → Exportar) para el seguimiento institucional.
6. **Desactive las encuestas al cerrar un período de evaluación** para que no aparezcan en el panel de los alumnos.

---

## Flujo recomendado para aplicar una encuesta

```
1. Menú → Encuestas
2. Encontrar la encuesta deseada (o crear una nueva)
3. Si necesita ajustarla: "Editar preguntas →"
4. Activar con el botón ⏻
5. Comunicar a los alumnos que tienen una encuesta pendiente
6. Monitorear respuestas en "Ver resultados →" (tablas de 10 en 10)
7. Atender alertas generadas en Menú → Alertas
8. Al cerrar el período: desactivar la encuesta con ⏻
9. Exportar resultados desde Menú → Respuestas → Exportar
```

---

*Manual PsicoEscolar v1.1 — Mayo 2026*
