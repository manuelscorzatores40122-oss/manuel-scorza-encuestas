-- Resetea todas las encuestas a "Toda la institución"
-- Ejecutar cuando Neon esté disponible:
-- psql "URL_DE_NEON" -f fix-surveys-targets.sql
UPDATE "Survey" SET "targetGrades" = '{}', "targetSections" = '{}';
