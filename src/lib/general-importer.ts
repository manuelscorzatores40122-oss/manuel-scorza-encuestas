import ExcelJS from 'exceljs';
import { Sexo, Nivel, EstadoMatricula, Role } from '@prisma/client';
import { prisma } from './prisma';
import { hashPassword } from './password';
import { calcEdad } from './utils';

export type GeneralImportResult = {
  total: number;
  creados: number;
  actualizados: number;
  errores: { fila: number; dni: string; razon: string }[];
  credenciales: { dni: string; nombre: string; clave: string }[];
};

// ─────────────────────────────────────────────
// ENTRADA PRINCIPAL
// ─────────────────────────────────────────────

export async function importStudentsGeneral(
  buffer: Buffer,
  fileName: string,
  anioAcademico: number = new Date().getFullYear()
): Promise<GeneralImportResult> {
  const isCSV = fileName.toLowerCase().endsWith('.csv');
  const rows  = isCSV
    ? await parseCSV(buffer)
    : await parseExcel(buffer);

  return processRows(rows, anioAcademico);
}

// ─────────────────────────────────────────────
// PARSEO EXCEL
// ─────────────────────────────────────────────

async function parseExcel(buffer: Buffer): Promise<Record<string, string>[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as any);
  const sheet = wb.worksheets[0];

  const headers: string[] = [];
  const rows: Record<string, string>[] = [];

  sheet.eachRow((row, rowNum) => {
    if (rowNum === 1) {
      row.eachCell((cell, col) => {
        headers[col] = normalizeKey(cell.text || String(cell.value ?? ''));
      });
      return;
    }

    const obj: Record<string, string> = {};
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      const key = headers[col];
      if (key) obj[key] = cellToString(cell);
    });

    // Skip empty rows
    if (!obj['dni'] && !obj['apellido_paterno']) return;
    rows.push(obj);
  });

  return rows;
}

// ─────────────────────────────────────────────
// PARSEO CSV
// ─────────────────────────────────────────────

async function parseCSV(buffer: Buffer): Promise<Record<string, string>[]> {
  const text  = buffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  // Detectar separador
  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = splitCSVLine(lines[0], sep).map(normalizeKey);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCSVLine(lines[i], sep);
    if (cells.every(c => !c.trim())) continue;
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cells[idx] ?? '').trim();
    });
    rows.push(obj);
  }

  return rows;
}

function splitCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let cur   = '';
  let inQ   = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === sep && !inQ) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

// ─────────────────────────────────────────────
// PROCESAMIENTO PRINCIPAL
// ─────────────────────────────────────────────

async function processRows(
  rows: Record<string, string>[],
  anioAcademico: number
): Promise<GeneralImportResult> {
  const result: GeneralImportResult = {
    total: 0,
    creados: 0,
    actualizados: 0,
    errores: [],
    credenciales: [],
  };

  // Cache de grados y secciones
  const gradeCache  = new Map<string, string>(); // "PRIMARIA-1" → gradeId
  const sectionCache = new Map<string, string>(); // "gradeId-A" → sectionId

  for (let idx = 0; idx < rows.length; idx++) {
    const fila = idx + 2; // fila 1 = header
    const row  = rows[idx];
    result.total++;

    try {
      // ── Campos requeridos ──────────────────
      const dni = normalizeDNI(row['dni'] || row['numero_documento'] || '');
      if (!dni) { result.errores.push({ fila, dni: '?', razon: 'DNI vacío o inválido' }); continue; }

      const apellidoPaterno = clean(row['apellido_paterno'] || row['apellidos_paterno'] || '');
      const apellidoMaterno = clean(row['apellido_materno'] || row['apellidos_materno'] || '');
      const nombres         = clean(row['nombres'] || row['nombre'] || '');
      if (!apellidoPaterno || !nombres) {
        result.errores.push({ fila, dni, razon: 'Apellido paterno o nombres vacíos' });
        continue;
      }

      const sexo = parseSexo(row['sexo']);
      if (!sexo) { result.errores.push({ fila, dni, razon: 'Sexo inválido (use M o F)' }); continue; }

      const fechaNacimiento = parseFecha(row['fecha_nacimiento'] || row['fecha_nac'] || row['fechanacimiento'] || '');
      if (!fechaNacimiento) { result.errores.push({ fila, dni, razon: 'Fecha de nacimiento inválida (use dd/mm/yyyy)' }); continue; }

      // ── Nivel y grado ──────────────────────
      const nivelRaw = (row['nivel'] || '').toUpperCase().trim();
      const nivel: Nivel = nivelRaw.includes('SEC') ? 'SECUNDARIA' : 'PRIMARIA';

      const gradoOrder = parseGradoOrder(row['grado'] || '');
      if (!gradoOrder) { result.errores.push({ fila, dni, razon: 'Grado inválido (use 1-6)' }); continue; }

      const seccionName = (row['seccion'] || row['sección'] || '').toUpperCase().trim();
      if (!seccionName) { result.errores.push({ fila, dni, razon: 'Sección vacía' }); continue; }

      // ── Opcional ───────────────────────────
      const codigoEstudiante = clean(row['codigo'] || row['codigo_estudiante'] || '');
      const estadoRaw        = (row['estado'] || 'DEFINITIVA').toUpperCase().trim();
      const estadoMatricula: EstadoMatricula =
        (['DEFINITIVA', 'RETIRADO', 'EGRESADO', 'TRASLADADO'] as const).includes(estadoRaw as any)
          ? (estadoRaw as EstadoMatricula)
          : 'DEFINITIVA';

      // ── Grade / Section ───────────────────
      const gradeKey = `${nivel}-${gradoOrder}`;
      let gradeId = gradeCache.get(gradeKey);
      if (!gradeId) {
        const grade = await prisma.grade.upsert({
          where: { nivel_order: { nivel, order: gradoOrder } },
          create: { name: `${gradoOrder}°`, order: gradoOrder, nivel },
          update: {},
        });
        gradeId = grade.id;
        gradeCache.set(gradeKey, gradeId);
      }

      const sectionKey = `${gradeId}-${seccionName}`;
      let sectionId = sectionCache.get(sectionKey);
      if (!sectionId) {
        const section = await prisma.section.upsert({
          where: { gradeId_name: { gradeId, name: seccionName } },
          create: { gradeId, name: seccionName },
          update: {},
        });
        sectionId = section.id;
        sectionCache.set(sectionKey, sectionId);
      }

      // ── Upsert User + Student ─────────────
      const fullName = `${apellidoPaterno} ${apellidoMaterno} ${nombres}`.trim();
      const clave    = dni.slice(-6);
      const edad     = calcEdad(fechaNacimiento);

      const existingStudent = await prisma.student.findUnique({ where: { dni } });

      if (existingStudent) {
        // Actualizar
        await prisma.student.update({
          where: { dni },
          data: {
            apellidoPaterno, apellidoMaterno, nombres, sexo,
            fechaNacimiento, edad, sectionId, estadoMatricula,
            anioAcademico,
            ...(codigoEstudiante ? { codigoEstudiante } : {}),
          },
        });
        await prisma.user.update({
          where: { id: existingStudent.userId },
          data: { fullName, username: dni, isActive: true },
        });
        result.actualizados++;
      } else {
        // Crear
        const user = await upsertUser(dni, fullName, clave);
        await prisma.student.create({
          data: {
            userId: user.id,
            dni,
            apellidoPaterno,
            apellidoMaterno,
            nombres,
            sexo,
            fechaNacimiento,
            edad,
            sectionId,
            estadoMatricula,
            anioAcademico,
            ...(codigoEstudiante ? { codigoEstudiante } : {}),
          },
        });
        result.creados++;
        result.credenciales.push({ dni, nombre: fullName, clave });
      }
    } catch (e: any) {
      const dni = row['dni'] || '?';
      result.errores.push({ fila, dni, razon: e.message || 'Error desconocido' });
    }
  }

  return result;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function upsertUser(dni: string, fullName: string, clave: string) {
  const existing = await prisma.user.findUnique({ where: { username: dni } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { fullName, isActive: true },
    });
  }
  return prisma.user.create({
    data: {
      username: dni,
      passwordHash: await hashPassword(clave),
      role: Role.STUDENT,
      fullName,
    },
  });
}

function normalizeKey(v: string): string {
  return v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function cellToString(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return `${v.getDate().toString().padStart(2,'0')}/${(v.getMonth()+1).toString().padStart(2,'0')}/${v.getFullYear()}`;
  if (typeof v === 'object' && 'text' in (v as any)) return String((v as any).text);
  if (typeof v === 'object' && 'result' in (v as any)) return String((v as any).result);
  return String(v).trim();
}

function clean(v: string): string {
  return v.trim().replace(/\s+/g, ' ');
}

function normalizeDNI(v: string): string | null {
  const digits = v.replace(/\D/g, '');
  if (digits.length === 8) return digits;
  if (digits.length === 9 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length >= 6 && digits.length <= 12) return digits; // CE u otro doc
  return null;
}

function parseSexo(v: string): Sexo | null {
  const s = v.trim().toUpperCase();
  if (s === 'M' || s === 'MASCULINO' || s === 'HOMBRE') return 'M';
  if (s === 'F' || s === 'FEMENINO'  || s === 'MUJER')  return 'F';
  return null;
}

function parseFecha(v: string): Date | null {
  if (!v) return null;
  // dd/mm/yyyy o dd-mm-yyyy
  const m = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  // yyyy-mm-dd
  const m2 = v.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m2) return new Date(Number(m2[1]), Number(m2[2]) - 1, Number(m2[3]));
  return null;
}

function parseGradoOrder(v: string): number | null {
  const n = parseInt(v.replace(/\D/g, ''), 10);
  if (n >= 1 && n <= 6) return n;
  const map: Record<string, number> = {
    PRIMERO: 1, SEGUNDO: 2, TERCERO: 3, CUARTO: 4, QUINTO: 5, SEXTO: 6,
  };
  const upper = v.toUpperCase().trim();
  for (const [k, val] of Object.entries(map)) {
    if (upper.includes(k)) return val;
  }
  return null;
}
