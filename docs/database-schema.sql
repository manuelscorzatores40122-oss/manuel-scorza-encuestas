-- PsicoEscolar - esquema de base de datos para documentacion
-- Fuente: prisma/schema.prisma
-- Motor: PostgreSQL
-- Nota: cuid() y updatedAt son gestionados por Prisma Client, no por PostgreSQL.

CREATE TYPE "Role" AS ENUM (
  'STUDENT',
  'TUTOR',
  'AUXILIAR',
  'PSYCHOLOGIST',
  'DIRECTOR',
  'ADMIN'
);

CREATE TYPE "Nivel" AS ENUM (
  'PRIMARIA',
  'SECUNDARIA'
);

CREATE TYPE "EstadoMatricula" AS ENUM (
  'DEFINITIVA',
  'RETIRADO',
  'EGRESADO',
  'TRASLADADO'
);

CREATE TYPE "Sexo" AS ENUM (
  'M',
  'F'
);

CREATE TYPE "Parentesco" AS ENUM (
  'PADRE',
  'MADRE',
  'APODERADO',
  'OTRO'
);

CREATE TYPE "QuestionType" AS ENUM (
  'SINGLE',
  'MULTI',
  'SCALE',
  'TEXT',
  'YES_NO'
);

CREATE TYPE "AlertRuleType" AS ENUM (
  'KEYWORD',
  'COMBINATION',
  'SCORE'
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastLogin" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Grade" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "nivel" "Nivel" NOT NULL,
  CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Section" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "gradeId" TEXT NOT NULL,
  "tutorId" TEXT,
  CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Student" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dni" TEXT NOT NULL,
  "codigoEstudiante" TEXT,
  "apellidoPaterno" TEXT NOT NULL,
  "apellidoMaterno" TEXT NOT NULL,
  "nombres" TEXT NOT NULL,
  "sexo" "Sexo" NOT NULL,
  "fechaNacimiento" TIMESTAMP(3) NOT NULL,
  "edad" INTEGER NOT NULL,
  "sectionId" TEXT NOT NULL,
  "estadoMatricula" "EstadoMatricula" NOT NULL DEFAULT 'DEFINITIVA',
  "anioAcademico" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Apoderado" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "parentesco" "Parentesco" NOT NULL,
  "apellidosNombres" TEXT NOT NULL,
  "sexo" "Sexo",
  "tipoDocumento" TEXT,
  "numeroDocumento" TEXT,
  "correo" TEXT,
  "celular" TEXT,
  "esContactoPrincipal" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "Apoderado_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Survey" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fechaFin" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "targetGrades" TEXT[],
  "targetSections" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Question" (
  "id" TEXT NOT NULL,
  "surveyId" TEXT NOT NULL,
  "type" "QuestionType" NOT NULL,
  "text" TEXT NOT NULL,
  "options" JSONB,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL,
  "riskScore" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Response" (
  "id" TEXT NOT NULL,
  "surveyId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "riskFlag" BOOLEAN NOT NULL DEFAULT false,
  "riskScore" INTEGER NOT NULL DEFAULT 0,
  "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
  "wantsToTalk" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Answer" (
  "id" TEXT NOT NULL,
  "responseId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AlertRule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "AlertRuleType" NOT NULL,
  "config" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "severity" TEXT NOT NULL DEFAULT 'MID',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Alert" (
  "id" TEXT NOT NULL,
  "responseId" TEXT NOT NULL,
  "ruleId" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "detail" TEXT,
  "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "notificarApoderado" BOOLEAN NOT NULL DEFAULT false,
  "notificadoEn" TIMESTAMP(3),
  CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT,
  "entityId" TEXT,
  "metadata" JSONB,
  "ip" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Announcement" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "targetRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User" ("username");
CREATE INDEX "User_role_idx" ON "User" ("role");

CREATE UNIQUE INDEX "Grade_nivel_order_key" ON "Grade" ("nivel", "order");

CREATE UNIQUE INDEX "Section_gradeId_name_key" ON "Section" ("gradeId", "name");

CREATE UNIQUE INDEX "Student_userId_key" ON "Student" ("userId");
CREATE UNIQUE INDEX "Student_dni_key" ON "Student" ("dni");
CREATE UNIQUE INDEX "Student_codigoEstudiante_key" ON "Student" ("codigoEstudiante");
CREATE INDEX "Student_sectionId_idx" ON "Student" ("sectionId");
CREATE INDEX "Student_anioAcademico_idx" ON "Student" ("anioAcademico");

CREATE INDEX "Apoderado_studentId_idx" ON "Apoderado" ("studentId");

CREATE INDEX "Survey_isActive_idx" ON "Survey" ("isActive");

CREATE INDEX "Question_surveyId_idx" ON "Question" ("surveyId");

CREATE INDEX "Response_studentId_idx" ON "Response" ("studentId");
CREATE INDEX "Response_surveyId_idx" ON "Response" ("surveyId");
CREATE INDEX "Response_riskFlag_idx" ON "Response" ("riskFlag");

CREATE INDEX "Answer_responseId_idx" ON "Answer" ("responseId");

CREATE INDEX "Alert_responseId_idx" ON "Alert" ("responseId");
CREATE INDEX "Alert_reviewedAt_idx" ON "Alert" ("reviewedAt");

CREATE INDEX "AuditLog_userId_idx" ON "AuditLog" ("userId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt");

CREATE INDEX "Announcement_isPublished_idx" ON "Announcement" ("isPublished");
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement" ("createdAt");

ALTER TABLE "Section"
  ADD CONSTRAINT "Section_gradeId_fkey"
  FOREIGN KEY ("gradeId") REFERENCES "Grade" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Section"
  ADD CONSTRAINT "Section_tutorId_fkey"
  FOREIGN KEY ("tutorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Student"
  ADD CONSTRAINT "Student_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Student"
  ADD CONSTRAINT "Student_sectionId_fkey"
  FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Apoderado"
  ADD CONSTRAINT "Apoderado_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Survey"
  ADD CONSTRAINT "Survey_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Question"
  ADD CONSTRAINT "Question_surveyId_fkey"
  FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Response"
  ADD CONSTRAINT "Response_surveyId_fkey"
  FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Response"
  ADD CONSTRAINT "Response_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Answer"
  ADD CONSTRAINT "Answer_responseId_fkey"
  FOREIGN KEY ("responseId") REFERENCES "Response" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Answer"
  ADD CONSTRAINT "Answer_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AlertRule"
  ADD CONSTRAINT "AlertRule_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Alert"
  ADD CONSTRAINT "Alert_responseId_fkey"
  FOREIGN KEY ("responseId") REFERENCES "Response" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Alert"
  ADD CONSTRAINT "Alert_ruleId_fkey"
  FOREIGN KEY ("ruleId") REFERENCES "AlertRule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Announcement"
  ADD CONSTRAINT "Announcement_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
