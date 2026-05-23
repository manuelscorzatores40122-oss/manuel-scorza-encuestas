#!/usr/bin/env bash
# Migración: PsicoEscolar (Neon) → manuel_db (PostgreSQL local)
# Notas sobre la fuente:
#   - Student tiene 1644 filas pero solo 548 DNI únicos (exactamente 3 duplicados por estudiante)
#   - Apoderado tiene 1013 filas, también triplicadas
#   - Se aplica DISTINCT ON para deduplicar antes de insertar
set -euo pipefail

NEON_URL="postgresql://neondb_owner:npg_eflFS7Co1XEp@ep-flat-block-amt748bh-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
MANUEL="postgresql://postgres:postgres@localhost:5432/manuel_db"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

echo "==> Exportando datos desde Neon..."

psql "$NEON_URL" -c "\copy (SELECT id, name, \"order\", nivel FROM \"Grade\") TO '$TMP_DIR/grades.csv' CSV HEADER"

psql "$NEON_URL" -c "\copy (SELECT id, name, \"gradeId\" FROM \"Section\") TO '$TMP_DIR/sections.csv' CSV HEADER"

# Solo el registro más reciente por DNI (DISTINCT ON elimina duplicados)
psql "$NEON_URL" -c "\copy (
  SELECT DISTINCT ON (dni)
    id, dni, \"codigoEstudiante\",
    \"apellidoPaterno\", \"apellidoMaterno\", nombres,
    sexo::text, \"fechaNacimiento\"::date,
    \"sectionId\", \"estadoMatricula\"::text, \"anioAcademico\"
  FROM \"Student\"
  ORDER BY dni, id
) TO '$TMP_DIR/students.csv' CSV HEADER"

# Solo el registro más reciente por (studentId, parentesco) para deduplicar
psql "$NEON_URL" -c "\copy (
  SELECT DISTINCT ON (\"studentId\", parentesco)
    id, \"studentId\", parentesco::text, \"apellidosNombres\",
    \"numeroDocumento\", correo, celular, \"esContactoPrincipal\"
  FROM \"Apoderado\"
  ORDER BY \"studentId\", parentesco, id
) TO '$TMP_DIR/apoderados.csv' CSV HEADER"

# Solo usuarios de estudiantes (uno por DNI = uno por User.id único)
psql "$NEON_URL" -c "\copy (
  SELECT DISTINCT ON (u.username)
    u.id, u.username, u.\"passwordHash\"
  FROM \"User\" u
  WHERE u.role = 'STUDENT'
  ORDER BY u.username, u.id
) TO '$TMP_DIR/users.csv' CSV HEADER"

echo "==> Exportación completada ($(wc -l < $TMP_DIR/students.csv) estudiantes, $(wc -l < $TMP_DIR/apoderados.csv) apoderados)."
echo "==> Cargando en manuel_db..."

psql "$MANUEL" <<SQL

-- ================================================================
-- 0. TABLAS TEMPORALES FUENTE
-- ================================================================
CREATE TEMP TABLE src_grade (
  src_id   TEXT,
  name     TEXT,
  ord      INT,
  nivel    TEXT
);
\copy src_grade FROM '$TMP_DIR/grades.csv' CSV HEADER

CREATE TEMP TABLE src_section (
  src_id    TEXT,
  name      TEXT,
  grade_id  TEXT
);
\copy src_section FROM '$TMP_DIR/sections.csv' CSV HEADER

CREATE TEMP TABLE src_student (
  src_id            TEXT,
  dni               TEXT,
  codigo_estudiante TEXT,
  apellido_paterno  TEXT,
  apellido_materno  TEXT,
  nombres           TEXT,
  sexo              TEXT,
  fecha_nacimiento  DATE,
  section_src_id    TEXT,
  estado_matricula  TEXT,
  anio_academico    INT
);
\copy src_student FROM '$TMP_DIR/students.csv' CSV HEADER

CREATE TEMP TABLE src_apoderado (
  src_id                TEXT,
  student_src_id        TEXT,
  parentesco            TEXT,
  apellidos_nombres     TEXT,
  numero_documento      TEXT,
  correo                TEXT,
  celular               TEXT,
  es_contacto_principal BOOLEAN
);
\copy src_apoderado FROM '$TMP_DIR/apoderados.csv' CSV HEADER

CREATE TEMP TABLE src_user (
  src_id        TEXT,
  username      TEXT,
  password_hash TEXT
);
\copy src_user FROM '$TMP_DIR/users.csv' CSV HEADER

-- ================================================================
-- 1. NIVELES
-- ================================================================
INSERT INTO niveles (nombre)
SELECT DISTINCT nivel FROM src_grade ORDER BY nivel
ON CONFLICT (nombre) DO NOTHING;

-- ================================================================
-- 2. GRADOS
-- ================================================================
INSERT INTO grados (nivel_id, nombre)
SELECT DISTINCT n.id, g.name
FROM src_grade g
JOIN niveles n ON n.nombre = g.nivel
ON CONFLICT (nivel_id, nombre) DO NOTHING;

-- Mapeo Grade.src_id → grados.id (DISTINCT ON src_id para evitar duplicados)
CREATE TEMP TABLE map_grade AS
SELECT DISTINCT ON (g.src_id)
  g.src_id,
  gr.id AS dest_id
FROM src_grade g
JOIN niveles n ON n.nombre = g.nivel
JOIN grados  gr ON gr.nivel_id = n.id AND gr.nombre = g.name
ORDER BY g.src_id;

-- ================================================================
-- 3. SECCIONES
-- ================================================================
INSERT INTO secciones (grado_id, nombre)
SELECT DISTINCT mg.dest_id, s.name
FROM src_section s
JOIN map_grade mg ON mg.src_id = s.grade_id
ON CONFLICT (grado_id, nombre) DO NOTHING;

-- Mapeo Section.src_id → secciones.id (DISTINCT ON src_id)
CREATE TEMP TABLE map_section AS
SELECT DISTINCT ON (s.src_id)
  s.src_id,
  sec.id AS dest_id
FROM src_section s
JOIN map_grade mg ON mg.src_id = s.grade_id
JOIN secciones sec ON sec.grado_id = mg.dest_id AND sec.nombre = s.name
ORDER BY s.src_id;

-- ================================================================
-- 4. AÑO ESCOLAR
-- ================================================================
INSERT INTO anios_escolares (anio)
SELECT DISTINCT anio_academico FROM src_student
ON CONFLICT (anio) DO NOTHING;

-- ================================================================
-- 5. ESTUDIANTES
-- ================================================================
INSERT INTO estudiantes (
  codigo_estudiante,
  apellido_paterno, apellido_materno, nombres,
  sexo, dni,
  fecha_nacimiento,
  egresado
)
SELECT
  st.codigo_estudiante,
  st.apellido_paterno,
  st.apellido_materno,
  st.nombres,
  st.sexo,
  st.dni,
  st.fecha_nacimiento,
  CASE WHEN st.estado_matricula IN ('EGRESADO','RETIRADO','TRASLADADO') THEN true ELSE false END
FROM src_student st
ON CONFLICT DO NOTHING;

-- Mapeo Student.src_id → estudiantes.id
CREATE TEMP TABLE map_student AS
SELECT st.src_id, e.id AS dest_id
FROM src_student st
JOIN estudiantes e ON e.dni = st.dni;

-- ================================================================
-- 6. MATRICULAS
-- ================================================================
INSERT INTO matriculas (estudiante_id, grado_id, seccion_id, anio_id, estado_matricula)
SELECT DISTINCT
  ms.dest_id,
  sec.grado_id,
  ms2.dest_id,
  ae.id,
  st.estado_matricula
FROM src_student st
JOIN map_student   ms  ON ms.src_id   = st.src_id
JOIN map_section   ms2 ON ms2.src_id  = st.section_src_id
JOIN secciones     sec ON sec.id      = ms2.dest_id
JOIN anios_escolares ae ON ae.anio    = st.anio_academico
ON CONFLICT (estudiante_id, anio_id) DO NOTHING;

-- ================================================================
-- 7. APODERADOS
--    apellidos_nombres = "AP_PAT AP_MAT NOMBRE(S)" (formato peruano)
-- ================================================================
INSERT INTO apoderados (
  apellido_paterno, apellido_materno, nombres,
  dni, celular, correo,
  parentesco
)
SELECT DISTINCT ON (COALESCE(NULLIF(TRIM(numero_documento), ''), src_id))
  split_part(TRIM(apellidos_nombres), ' ', 1),
  split_part(TRIM(apellidos_nombres), ' ', 2),
  TRIM(regexp_replace(TRIM(apellidos_nombres), '^\S+\s+\S+\s*', '')),
  NULLIF(TRIM(numero_documento), ''),
  NULLIF(TRIM(celular), ''),
  NULLIF(TRIM(correo), ''),
  CASE parentesco
    WHEN 'PADRE'     THEN 'padre'::parentesco_tipo
    WHEN 'MADRE'     THEN 'madre'::parentesco_tipo
    WHEN 'APODERADO' THEN 'tutor_legal'::parentesco_tipo
    ELSE                  'otro'::parentesco_tipo
  END
FROM src_apoderado
ORDER BY COALESCE(NULLIF(TRIM(numero_documento), ''), src_id), src_id
ON CONFLICT (dni) DO NOTHING;

-- Mapeo Apoderado.src_id → apoderados.id (por DNI, con fallback por nombre+parentesco)
CREATE TEMP TABLE map_apoderado AS
SELECT DISTINCT ON (sa.src_id)
  sa.src_id,
  ap.id AS dest_id
FROM src_apoderado sa
JOIN apoderados ap ON (
  ap.dni IS NOT NULL AND ap.dni = NULLIF(TRIM(sa.numero_documento), '')
) OR (
  ap.dni IS NULL
  AND ap.apellido_paterno = split_part(TRIM(sa.apellidos_nombres), ' ', 1)
  AND ap.apellido_materno = split_part(TRIM(sa.apellidos_nombres), ' ', 2)
  AND ap.parentesco = CASE sa.parentesco
        WHEN 'PADRE'     THEN 'padre'::parentesco_tipo
        WHEN 'MADRE'     THEN 'madre'::parentesco_tipo
        WHEN 'APODERADO' THEN 'tutor_legal'::parentesco_tipo
        ELSE                  'otro'::parentesco_tipo
      END
)
ORDER BY sa.src_id;

-- ================================================================
-- 8. ESTUDIANTE_APODERADO
-- ================================================================
INSERT INTO estudiante_apoderado (estudiante_id, apoderado_id)
SELECT DISTINCT ms.dest_id, ma.dest_id
FROM src_apoderado sa
JOIN map_student   ms ON ms.src_id = sa.student_src_id
JOIN map_apoderado ma ON ma.src_id = sa.src_id
ON CONFLICT (estudiante_id, apoderado_id) DO NOTHING;

-- ================================================================
-- 9. CONTACTO DE EMERGENCIA  (un registro por estudiante, con celular del apoderado principal)
-- ================================================================
INSERT INTO contacto_emergencia (estudiante_id, telefono, con_quien_vive)
SELECT DISTINCT ON (ms.dest_id)
  ms.dest_id,
  NULLIF(TRIM(sa.celular), ''),
  split_part(TRIM(sa.apellidos_nombres), ' ', 1) || ' ' ||
  split_part(TRIM(sa.apellidos_nombres), ' ', 2)
FROM src_apoderado sa
JOIN map_student   ms ON ms.src_id = sa.student_src_id
WHERE sa.es_contacto_principal = true
ORDER BY ms.dest_id, sa.src_id;

-- ================================================================
-- 10. USUARIOS
-- ================================================================
INSERT INTO usuarios (nombre_usuario, contrasena)
SELECT username, password_hash
FROM src_user
ON CONFLICT (nombre_usuario) DO NOTHING;

-- ================================================================
-- REPORTE FINAL
-- ================================================================
SELECT
  tabla,
  insertados AS filas
FROM (VALUES
  ('niveles',             (SELECT COUNT(*) FROM niveles)),
  ('grados',              (SELECT COUNT(*) FROM grados)),
  ('secciones',           (SELECT COUNT(*) FROM secciones)),
  ('anios_escolares',     (SELECT COUNT(*) FROM anios_escolares)),
  ('estudiantes',         (SELECT COUNT(*) FROM estudiantes)),
  ('matriculas',          (SELECT COUNT(*) FROM matriculas)),
  ('apoderados',          (SELECT COUNT(*) FROM apoderados)),
  ('estudiante_apoderado',(SELECT COUNT(*) FROM estudiante_apoderado)),
  ('contacto_emergencia', (SELECT COUNT(*) FROM contacto_emergencia)),
  ('usuarios',            (SELECT COUNT(*) FROM usuarios))
) AS t(tabla, insertados)
ORDER BY tabla;

SQL

echo "==> Migración completada."
