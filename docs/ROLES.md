# Roles y permisos

## Estudiante (`STUDENT`)

**Login:** DNI / clave = últimos 6 dígitos del DNI (cambiable después).

**Puede:**
- Responder encuestas activas dirigidas a su grado.
- Ver lista de sus respuestas pasadas (sin score ni nivel de riesgo).

**No puede:**
- Ver respuestas de otros estudiantes.
- Ver alertas, scores ni evaluación de riesgo.

**Tema visual:** cálido (naranja), interfaz lúdica.

## Tutor (`TUTOR`)

**Login:** correo institucional + clave asignada por admin.

**Puede:**
- Ver lista de estudiantes de la(s) sección(es) que tiene asignadas.
- Ver respuestas no anónimas de su sección.

**No puede:**
- Acceder a información de otras secciones.
- Ver alertas de riesgo, scores ni evaluaciones (eso es del psicólogo).
- Crear o modificar encuestas.

## Auxiliar (`AUXILIAR`)

**Login:** correo institucional + clave.

**Puede:**
- Ver lista completa de estudiantes (todos los grados y secciones).
- Ver respuestas (contenido) de cualquier estudiante.

**No puede:**
- Ver alertas, scores, niveles de riesgo.
- Crear ni modificar nada.

## Psicólogo (`PSYCHOLOGIST`)

**Login:** correo institucional + clave.

**Puede (acceso completo al contenido clínico):**
- Crear, editar, activar/desactivar encuestas.
- Ver respuestas individuales con identificación completa.
- Ver alertas, decidir si notificar al apoderado.
- Acceder al histórico individual de cada estudiante con timeline.
- Exportar respuestas filtradas a Excel.

**No puede:**
- Crear usuarios staff (eso es del admin).
- Modificar reglas del motor de alertas (eso es del admin).
- Importar nómina SIAGIE (eso es del admin).

## Director (`DIRECTOR`)

**Login:** correo institucional + clave.

**Puede:**
- Ver estadísticas agregadas y anonimizadas.
- Ver distribución de riesgo por nivel y por grado.
- Ver participación en encuestas.
- Ver comparativa primaria vs secundaria.

**No puede:**
- Acceder a respuestas individuales.
- Ver nombres ni DNIs de estudiantes con alertas.
- Crear usuarios ni modificar configuración.

## Administrador (`ADMIN`)

**Login:** correo institucional + clave.

**Puede:**
- Importar nómina SIAGIE y gestionar año académico.
- Crear, desactivar usuarios staff y resetear sus claves.
- Configurar reglas del motor de alertas (3 tipos).
- Ver auditoría completa del sistema.
- Activar/desactivar encuestas creadas por el psicólogo.

**No puede (por diseño):**
- Ver el contenido detallado de las respuestas (eso es función clínica del psicólogo).
- Ver alertas individuales (las gestiona el psicólogo).

> El admin puede ser técnicamente la misma persona que la coordinación o secretaría académica del colegio. El director y el psicólogo deben ser cuentas separadas.
