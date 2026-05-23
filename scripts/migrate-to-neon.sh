#!/usr/bin/env bash
# Migración inversa: manuel_db (local) → PsicoEscolar Neon
# Mapeo:
#   niveles + grados → "Grade"
#   secciones        → "Section"
#   usuarios + estudiantes + matriculas → "User" + "Student"
#   apoderados + estudiante_apoderado   → "Apoderado"
# Los IDs de Neon se generan como md5 determinístico del ID local
# para que el script sea idempotente (re-ejecutable sin duplicados).
set -euo pipefail

NEON_URL="postgresql://neondb_owner:npg_eflFS7Co1XEp@ep-flat-block-amt748bh-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
MANUEL="postgresql://postgres:postgres@localhost:5432/manuel_db"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

echo "==> Exportando desde manuel_db..."

# Grados con su nivel
psql "$MANUEL" -c "\copy (
  SELECT g.id, g.nombre, g.id AS ord, n.nombre AS nivel
  FROM grados g JOIN niveles n ON n.id = g.nivel_id
) TO '$TMP_DIR/grades.csv' CSV HEADER"

# Secciones con su grado
psql "$MANUEL" -c "\copy (
  SELECT s.id, s.nombre, s.grado_id
  FROM secciones s
) TO '$TMP_DIR/sections.csv' CSV HEADER"

# Estudiantes con matrícula (un registro por estudiante)
psql "$MANUEL" -c "\copy (
  SELECT
    e.id,
    e.codigo_estudiante,
    u.nombre_usuario,
    u.contrasena,
    e.apellido_paterno,
    e.apellido_materno,
    e.nombres,
    e.sexo,
    e.dni,
    e.fecha_nacimiento,
    m.seccion_id,
    m.estado_matricula,
    ae.anio
  FROM estudiantes e
  JOIN usuarios u ON u.nombre_usuario = e.codigo_estudiante
  JOIN matriculas m ON m.estudiante_id = e.id
  JOIN anios_escolares ae ON ae.id = m.anio_id
) TO '$TMP_DIR/students.csv' CSV HEADER"

# Apoderados con relación a estudiante
psql "$MANUEL" -c "\copy (
  SELECT
    a.id,
    ea.estudiante_id,
    a.parentesco::text,
    a.apellido_paterno || ' ' || a.apellido_materno || ' ' || a.nombres AS apellidos_nombres,
    a.dni,
    a.correo,
    a.celular
  FROM apoderados a
  JOIN estudiante_apoderado ea ON ea.apoderado_id = a.id
) TO '$TMP_DIR/apoderados.csv' CSV HEADER"

echo "==> Exportación lista. Cargando en Neon..."

PGPASSWORD=npg_eflFS7Co1XEp psql "$NEON_URL" <<SQL

-- ================================================================
-- LIMPIAR TABLAS TEMPORALES DE EJECUCIONES ANTERIORES
-- ================================================================
DROP TABLE IF EXISTS src_grade, src_section, src_student, src_apoderado;

-- ================================================================
-- TABLAS TEMPORALES
-- ================================================================
CREATE TEMP TABLE src_grade (
  local_id  INT,
  nombre    TEXT,
  ord       INT,
  nivel     TEXT
);
\copy src_grade FROM '$TMP_DIR/grades.csv' CSV HEADER

CREATE TEMP TABLE src_section (
  local_id     INT,
  nombre       TEXT,
  grado_id_loc INT
);
\copy src_section FROM '$TMP_DIR/sections.csv' CSV HEADER

CREATE TEMP TABLE src_student (
  local_id         INT,
  codigo_estudiante TEXT,
  nombre_usuario    TEXT,
  contrasena        TEXT,
  apellido_paterno  TEXT,
  apellido_materno  TEXT,
  nombres           TEXT,
  sexo              TEXT,
  dni               TEXT,
  fecha_nacimiento  DATE,
  seccion_id_loc    INT,
  estado_matricula  TEXT,
  anio_academico    INT
);
\copy src_student FROM '$TMP_DIR/students.csv' CSV HEADER

CREATE TEMP TABLE src_apoderado (
  local_id         INT,
  estudiante_id_loc INT,
  parentesco        TEXT,
  apellidos_nombres TEXT,
  dni               TEXT,
  correo            TEXT,
  celular           TEXT
);
\copy src_apoderado FROM '$TMP_DIR/apoderados.csv' CSV HEADER

-- ================================================================
-- 1. GRADE  (IDs determinísticos basados en local_id)
-- ================================================================
INSERT INTO "Grade" (id, name, "order", nivel)
SELECT
  md5('grade:' || local_id::text),
  nombre,
  ord,
  nivel::"Nivel"
FROM src_grade
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- 2. SECTION
-- ================================================================
INSERT INTO "Section" (id, name, "gradeId")
SELECT
  md5('section:' || local_id::text),
  nombre,
  md5('grade:' || grado_id_loc::text)
FROM src_section
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- 3. USER  (rol STUDENT)
-- ================================================================
INSERT INTO "User" (id, username, "passwordHash", role, "fullName", "isActive", "updatedAt")
SELECT
  md5('user:' || local_id::text),
  nombre_usuario,
  contrasena,
  'STUDENT'::"Role",
  apellido_paterno || ' ' || apellido_materno || ' ' || nombres,
  true,
  NOW()
FROM src_student
ON CONFLICT (id)        DO NOTHING;

-- ================================================================
-- 4. STUDENT
-- ================================================================
INSERT INTO "Student" (
  id, "userId", dni, "codigoEstudiante",
  "apellidoPaterno", "apellidoMaterno", nombres,
  sexo, "fechaNacimiento", edad,
  "sectionId", "estadoMatricula", "anioAcademico",
  "updatedAt"
)
SELECT
  md5('student:' || local_id::text),
  md5('user:'    || local_id::text),
  dni,
  codigo_estudiante,
  apellido_paterno,
  apellido_materno,
  nombres,
  sexo::"Sexo",
  fecha_nacimiento,
  DATE_PART('year', AGE(fecha_nacimiento))::INT,
  md5('section:' || seccion_id_loc::text),
  estado_matricula::"EstadoMatricula",
  anio_academico,
  NOW()
FROM src_student
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- 5. APODERADO
-- ================================================================
INSERT INTO "Apoderado" (
  id, "studentId", parentesco,
  "apellidosNombres", "numeroDocumento",
  correo, celular, "esContactoPrincipal"
)
SELECT
  md5('apoderado:' || local_id::text),
  md5('student:'   || estudiante_id_loc::text),
  CASE parentesco
    WHEN 'padre'      THEN 'PADRE'
    WHEN 'madre'      THEN 'MADRE'
    WHEN 'tutor_legal'THEN 'APODERADO'
    ELSE                   'OTRO'
  END::"Parentesco",
  apellidos_nombres,
  NULLIF(TRIM(dni), ''),
  NULLIF(TRIM(correo), ''),
  NULLIF(TRIM(celular), ''),
  false
FROM src_apoderado
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- REPORTE FINAL
-- ================================================================
SELECT tabla, filas FROM (VALUES
  ('Grade',     (SELECT COUNT(*) FROM "Grade")),
  ('Section',   (SELECT COUNT(*) FROM "Section")),
  ('User',      (SELECT COUNT(*) FROM "User")),
  ('Student',   (SELECT COUNT(*) FROM "Student")),
  ('Apoderado', (SELECT COUNT(*) FROM "Apoderado"))
) AS t(tabla, filas)
ORDER BY tabla;

SQL

echo "==> Migración a Neon completada."
