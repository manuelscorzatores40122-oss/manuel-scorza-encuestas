import ExcelJS from 'exceljs';
import { Sexo, Nivel, EstadoMatricula, Role, Parentesco } from '@prisma/client';
import { prisma } from './prisma';
import { hashPassword } from './password';
import { calcEdad } from './utils';

export type ImportResult = {
  total: number;
  creados: number;
  actualizados: number;
  errores: { fila: number; razon: string }[];
  credenciales: { dni: string; clave: string; nombre: string }[];
};

/**
 * Parsea un Excel SIAGIE de "rptPadresFamiliaEstudiantes".
 * Header en fila 12, datos desde fila 13.
 *
 * Mapeo de columnas (según el reporte estándar SIAGIE):
 *   ITEM | GRADO | SECCIÓN | DNI | CÓDIGO | APELLIDO PATERNO | APELLIDO MATERNO |
 *   NOMBRES | SEXO | FECHA NAC | EDAD | (datos padre) | (datos madre) | (datos apoderado)
 */
export async function importSiagieExcel(
  buffer: ArrayBuffer | Buffer,
  nivel: Nivel,
  anioAcademico: number = new Date().getFullYear()
): Promise<ImportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.worksheets[0];

  const result: ImportResult = {
    total: 0,
    creados: 0,
    actualizados: 0,
    errores: [],
    credenciales: [],
  };

  const GROUP_ROW = 11;
  const HEADER_ROW = 12;
  const DATA_START = 13;

  // Construir mapa de columnas usando el formato SIAGIE:
  // fila 11 = bloque (ESTUDIANTE/PADRE/MADRE/APODERADO)
  // fila 12 = nombre de columna. Esto evita confundir columnas repetidas
  // como "SEXO" o "APELLIDOS Y NOMBRES".
  const groupRow = sheet.getRow(GROUP_ROW);
  const headerRow = sheet.getRow(HEADER_ROW);
  const groupedColMap: Record<string, number> = {};

  headerRow.eachCell((cell, colNumber) => {
    const label = normalizeHeader(cell.text || cell.value);
    const group = normalizeHeader(groupRow.getCell(colNumber).text || groupRow.getCell(colNumber).value);
    if (!label) return;
    // En SIAGIE hay celdas combinadas que ExcelJS repite en varias columnas.
    // Nos quedamos con la primera aparición útil para cada campo.
    if (group && !groupedColMap[`${group}.${label}`]) {
      groupedColMap[`${group}.${label}`] = colNumber;
    }
  });

  const getFrom = (row: ExcelJS.Row, group: string, ...names: string[]) => {
    const normalizedGroup = normalizeHeader(group);
    for (const n of names) {
      const c = groupedColMap[`${normalizedGroup}.${normalizeHeader(n)}`];
      if (c) {
        const val = row.getCell(c).value;
        if (val !== null && val !== undefined && val !== '') return val;
      }
    }
    return null;
  };

  const requiredStudentColumns = [
    ['ESTUDIANTE', 'GRADO'],
    ['ESTUDIANTE', 'SECCION'],
    ['ESTUDIANTE', 'NUMERO DE DOCUMENTO'],
    ['ESTUDIANTE', 'APELLIDO PATERNO'],
    ['ESTUDIANTE', 'APELLIDO MATERNO'],
    ['ESTUDIANTE', 'NOMBRES'],
  ];
  const missingColumns = requiredStudentColumns.filter(([group, label]) => {
    return !groupedColMap[`${normalizeHeader(group)}.${normalizeHeader(label)}`];
  });
  if (missingColumns.length > 0) {
    const names = missingColumns.map(([group, label]) => `${group}.${label}`);
    throw new Error(`El archivo no tiene el formato SIAGIE esperado. Faltan columnas: ${names.join(', ')}`);
  }

  const grades = await prisma.grade.findMany({
    where: { nivel },
    include: { sections: true },
  });
  const sectionsByGradeAndName = new Map<string, string>();
  for (const grade of grades) {
    for (const section of grade.sections) {
      sectionsByGradeAndName.set(`${grade.order}.${section.name.toUpperCase()}`, section.id);
    }
  }

  const lastRow = sheet.actualRowCount;

  for (let r = DATA_START; r <= lastRow; r++) {
    const row = sheet.getRow(r);
    try {
      const tipoDocumentoEst = String(getFrom(row, 'ESTUDIANTE', 'TIPO DE DOCUMENTO') ?? '').trim();
      const numeroDocumentoRaw = getFrom(row, 'ESTUDIANTE', 'NÚMERO DE DOCUMENTO', 'NÙMERO DE DOCUMENTO', 'NUMERO DE DOCUMENTO');
      const dni = normalizeStudentDocument(numeroDocumentoRaw, tipoDocumentoEst);
      if (!dni) {
        result.errores.push({
          fila: r,
          razon: `Documento inválido (${tipoDocumentoEst || 'sin tipo'}): ${numeroDocumentoRaw}`,
        });
        continue;
      }

      const gradoRaw = String(getFrom(row, 'ESTUDIANTE', 'GRADO', 'GRADO/AÑO') ?? '').trim();
      const seccionRaw = String(getFrom(row, 'ESTUDIANTE', 'SECCIÓN', 'SECCION') ?? '').trim().toUpperCase();
      const apPaterno = String(getFrom(row, 'ESTUDIANTE', 'APELLIDO PATERNO', 'AP. PATERNO') ?? '').trim();
      const apMaterno = String(getFrom(row, 'ESTUDIANTE', 'APELLIDO MATERNO', 'AP. MATERNO') ?? '').trim();
      const nombres = String(getFrom(row, 'ESTUDIANTE', 'NOMBRES', 'NOMBRE') ?? '').trim();
      const sexoRaw = String(getFrom(row, 'ESTUDIANTE', 'SEXO', 'GÉNERO', 'GENERO') ?? '').trim().toUpperCase();
      const fechaNacRaw = getFrom(row, 'ESTUDIANTE', 'FECHA DE NACIMIENTO', 'FECHA NACIMIENTO', 'FECHA NAC.', 'FECHA NAC', 'F. NAC.');
      const codigoEst = String(getFrom(row, 'ESTUDIANTE', 'CÓDIGO DEL ESTUDIANTE', 'CODIGO DEL ESTUDIANTE', 'CÓDIGO', 'CODIGO') ?? '').trim() || null;

      if (!nombres || !apPaterno) {
        result.errores.push({ fila: r, razon: 'Faltan nombres o apellido paterno' });
        continue;
      }

      // Parsear grado: "1°", "PRIMERO", "1"
      const gradeOrder = parseGradeOrder(gradoRaw);
      if (!gradeOrder) {
        result.errores.push({ fila: r, razon: `Grado no reconocido: ${gradoRaw}` });
        continue;
      }

      const gradeExists = grades.some((grade) => grade.order === gradeOrder);
      if (!gradeExists) {
        result.errores.push({ fila: r, razon: `Grado ${gradeOrder} de ${nivel} no existe` });
        continue;
      }

      const sectionId = sectionsByGradeAndName.get(`${gradeOrder}.${seccionRaw}`);
      if (!sectionId) {
        result.errores.push({ fila: r, razon: `Sección ${seccionRaw} no existe en ${gradoRaw}` });
        continue;
      }

      const sexo: Sexo = sexoRaw.startsWith('F') ? Sexo.F : Sexo.M;
      const fechaNac = parseFecha(fechaNacRaw);
      const edad = fechaNac ? calcEdad(fechaNac) : 0;
      const fullName = `${nombres} ${apPaterno} ${apMaterno}`.trim();

      // Crear o actualizar usuario + estudiante. Para estudiantes extranjeros,
      // el documento puede cambiar entre reportes; si el código SIAGIE existe,
      // lo usamos también para ubicar al mismo alumno.
      const existing = await prisma.student.findFirst({
        where: {
          OR: [
            { dni },
            ...(codigoEst ? [{ codigoEstudiante: codigoEst }] : []),
          ],
        },
      });
      const codigoConflict = codigoEst && existing?.codigoEstudiante !== codigoEst
        ? await prisma.student.findUnique({ where: { codigoEstudiante: codigoEst } })
        : null;
      const codigoForWrite = codigoConflict && codigoConflict.id !== existing?.id ? null : codigoEst;
      const clave = dni.slice(-6);
      let studentId: string;

      if (existing) {
        const updated = await prisma.student.update({
          where: { id: existing.id },
          data: {
            dni, nombres, apellidoPaterno: apPaterno, apellidoMaterno: apMaterno,
            sexo, sectionId, anioAcademico,
            estadoMatricula: EstadoMatricula.DEFINITIVA,
            ...(fechaNac ? { fechaNacimiento: fechaNac, edad } : {}),
            ...(codigoForWrite ? { codigoEstudiante: codigoForWrite } : {}),
          },
        });
        await syncStudentUser(existing.userId, dni, fullName);
        studentId = updated.id;
        result.actualizados++;
      } else {
        const user = await findOrCreateStudentUser(dni, fullName, clave);
        const student = await prisma.student.create({
          data: {
            userId: user.id,
            dni,
            codigoEstudiante: codigoForWrite,
            apellidoPaterno: apPaterno,
            apellidoMaterno: apMaterno,
            nombres,
            sexo,
            fechaNacimiento: fechaNac || new Date(2010, 0, 1),
            edad,
            sectionId,
            estadoMatricula: EstadoMatricula.DEFINITIVA,
            anioAcademico,
          },
        });
        studentId = student.id;
        result.credenciales.push({ dni, clave, nombre: fullName });
        result.creados++;
      }

      await upsertApoderados(studentId, [
        {
          parentesco: Parentesco.PADRE,
          data: readApoderado(row, getFrom, 'PADRE'),
        },
        {
          parentesco: Parentesco.MADRE,
          data: readApoderado(row, getFrom, 'MADRE'),
        },
        {
          parentesco: Parentesco.APODERADO,
          data: { ...readApoderado(row, getFrom, 'APODERADO'), principal: true },
        },
      ]);

      result.total++;
    } catch (err: any) {
      result.errores.push({ fila: r, razon: err.message || String(err) });
    }
  }

  // Marcar como retirados aquellos del año académico previo no presentes en esta importación
  // (Solo si se importa para el año académico actual completo)
  // Esta lógica es opcional; la activamos solo si el importador lo solicita explícitamente.

  return result;
}

type ApoderadoInput = {
  apellidosNombres: string;
  sexo?: Sexo | null;
  tipoDocumento: string;
  numeroDocumento: string;
  correo: string;
  celular: string;
  principal?: boolean;
};

type GetFromRow = (row: ExcelJS.Row, group: string, ...names: string[]) => unknown;

function readApoderado(row: ExcelJS.Row, getFrom: GetFromRow, group: string): ApoderadoInput {
  return {
    apellidosNombres: String(getFrom(row, group, 'APELLIDOS Y NOMBRES') ?? '').trim(),
    sexo: parseSexo(getFrom(row, group, 'SEXO')),
    tipoDocumento: String(getFrom(row, group, 'TIPO DE DOCUMENTO', 'TIPO DE DE DOCUMENTO') ?? '').trim(),
    numeroDocumento: String(getFrom(row, group, 'NÚMERO DE DOCUMENTO', 'NUMERO DE DOCUMENTO', 'NÚMERO', 'NUMERO') ?? '').trim(),
    correo: String(getFrom(row, group, 'CORREO ELECTRÓNICO', 'CORREO ELECTRONICO', 'CORREO', 'EMAIL') ?? '').trim(),
    celular: String(getFrom(row, group, 'NÚMERO CELULAR', 'NUMERO CELULAR', 'CELULAR', 'TELÉFONO', 'TELEFONO') ?? '').trim(),
  };
}

async function upsertApoderados(
  studentId: string,
  contacts: { parentesco: Parentesco; data: ApoderadoInput }[]
) {
  const existingContacts = await prisma.apoderado.findMany({
    where: {
      studentId,
      parentesco: { in: contacts.map((contact) => contact.parentesco) },
    },
  });
  const existingByParentesco = new Map(existingContacts.map((contact) => [contact.parentesco, contact]));

  for (const { parentesco, data } of contacts) {
    if (!data.apellidosNombres) continue;
    const payload = {
      apellidosNombres: data.apellidosNombres,
      sexo: data.sexo || null,
      numeroDocumento: data.numeroDocumento || null,
      tipoDocumento: data.tipoDocumento || (data.numeroDocumento ? 'DNI' : null),
      correo: data.correo || null,
      celular: data.celular || null,
      esContactoPrincipal: !!data.principal,
    };
    const existing = existingByParentesco.get(parentesco);
    if (existing) {
      await prisma.apoderado.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.apoderado.create({
        data: { ...payload, parentesco, studentId },
      });
    }
  }
}

async function findOrCreateStudentUser(username: string, fullName: string, clave: string) {
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) {
    return prisma.user.update({
      where: { id: existingUser.id },
      data: { fullName, role: Role.STUDENT, isActive: true },
    });
  }

  return prisma.user.create({
    data: {
      username,
      passwordHash: await hashPassword(clave),
      role: Role.STUDENT,
      fullName,
    },
  });
}

async function syncStudentUser(userId: string, username: string, fullName: string) {
  const conflictingUser = await prisma.user.findUnique({ where: { username } });
  if (conflictingUser && conflictingUser.id !== userId) {
    // Puede quedar un usuario huérfano si una importación previa creó el user
    // y falló antes de crear Student. En ese caso no forzamos el username para
    // evitar violar el unique; al menos mantenemos activo el usuario enlazado.
    await prisma.user.update({
      where: { id: userId },
      data: { fullName, isActive: true },
    });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { username, fullName, isActive: true },
  });
}

function parseGradeOrder(g: string): number | null {
  const cleaned = g.toUpperCase().trim();
  const m = cleaned.match(/(\d+)/);
  if (m) return Number(m[1]);
  const map: Record<string, number> = {
    PRIMERO: 1, SEGUNDO: 2, TERCERO: 3, CUARTO: 4, QUINTO: 5, SEXTO: 6,
  };
  for (const [k, v] of Object.entries(map)) if (cleaned.includes(k)) return v;
  return null;
}

function parseSexo(v: any): Sexo | null {
  const s = String(v ?? '').trim().toUpperCase();
  if (!s) return null;
  if (s.startsWith('F') || s.startsWith('MUJER')) return Sexo.F;
  if (s.startsWith('M') || s.startsWith('HOMBRE')) return Sexo.M;
  return null;
}

function normalizeStudentDocument(v: any, tipoDocumento: string): string | null {
  const raw = String(v ?? '').trim();
  if (!raw) return null;

  const type = normalizeHeader(tipoDocumento);
  if (!type || type === 'DNI' || type.includes('DOCUMENTO NACIONAL')) {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return null;
    if (digits.length < 8) return digits.padStart(8, '0');
    if (digits.length === 8) return digits;
    if (digits.length === 9 && digits.startsWith('0')) return digits.slice(-8);
    return null;
  }

  // Estudiantes extranjeros pueden venir con CE, PTP, CPP, pasaporte u otros
  // documentos. Conservamos letras y números para que puedan iniciar sesión
  // con el mismo documento registrado en SIAGIE.
  const doc = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (doc.length < 4 || doc.length > 20) return null;
  return doc;
}

function parseFecha(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'number') {
    // Excel serial date
    return new Date(Math.round((v - 25569) * 86400 * 1000));
  }
  const s = String(v).trim();
  // dd/mm/yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function normalizeHeader(v: any): string {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[°º.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
