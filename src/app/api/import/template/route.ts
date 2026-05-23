import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';

export async function GET() {
  const wb    = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Alumnos');

  // ── Columnas ───────────────────────────────────────────────────
  sheet.columns = [
    { header: 'DNI',              key: 'dni',               width: 12 },
    { header: 'APELLIDO_PATERNO', key: 'apellido_paterno',  width: 20 },
    { header: 'APELLIDO_MATERNO', key: 'apellido_materno',  width: 20 },
    { header: 'NOMBRES',          key: 'nombres',           width: 25 },
    { header: 'SEXO',             key: 'sexo',              width: 8  },
    { header: 'FECHA_NACIMIENTO', key: 'fecha_nacimiento',  width: 16 },
    { header: 'NIVEL',            key: 'nivel',             width: 12 },
    { header: 'GRADO',            key: 'grado',             width: 8  },
    { header: 'SECCION',          key: 'seccion',           width: 10 },
    { header: 'CODIGO_ESTUDIANTE',key: 'codigo_estudiante', width: 18 },
    { header: 'ESTADO',           key: 'estado',            width: 14 },
  ];

  // ── Estilo del header ──────────────────────────────────────────
  const headerRow = sheet.getRow(1);
  headerRow.eachCell(cell => {
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1B4B' } };
    cell.font   = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF6366F1' } },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  headerRow.height = 22;

  // ── Filas de ejemplo ───────────────────────────────────────────
  const ejemplos = [
    { dni: '12345678', apellido_paterno: 'GARCIA', apellido_materno: 'LOPEZ', nombres: 'JUAN CARLOS', sexo: 'M', fecha_nacimiento: '15/03/2010', nivel: 'PRIMARIA',   grado: '3', seccion: 'A', codigo_estudiante: '', estado: 'DEFINITIVA' },
    { dni: '87654321', apellido_paterno: 'MAMANI', apellido_materno: 'QUISPE', nombres: 'ANA LUCIA',  sexo: 'F', fecha_nacimiento: '22/07/2008', nivel: 'SECUNDARIA', grado: '2', seccion: 'B', codigo_estudiante: '', estado: 'DEFINITIVA' },
  ];

  ejemplos.forEach((d, i) => {
    const row = sheet.addRow(d);
    row.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: i % 2 === 0 ? 'FFF5F3FF' : 'FFFFFFFF' },
      };
      cell.alignment = { vertical: 'middle' };
    });
    row.height = 18;
  });

  // ── Hoja de instrucciones ──────────────────────────────────────
  const info = wb.addWorksheet('Instrucciones');
  info.getColumn(1).width = 30;
  info.getColumn(2).width = 55;

  const instrucciones: [string, string][] = [
    ['COLUMNA',            'DESCRIPCIÓN / VALORES VÁLIDOS'],
    ['DNI',                '8 dígitos. Obligatorio.'],
    ['APELLIDO_PATERNO',   'Apellido paterno. Obligatorio.'],
    ['APELLIDO_MATERNO',   'Apellido materno. Obligatorio.'],
    ['NOMBRES',            'Nombres completos. Obligatorio.'],
    ['SEXO',               'M = Masculino  |  F = Femenino. Obligatorio.'],
    ['FECHA_NACIMIENTO',   'Formato dd/mm/yyyy  (ej: 15/03/2010). Obligatorio.'],
    ['NIVEL',              'PRIMARIA  o  SECUNDARIA. Obligatorio.'],
    ['GRADO',              '1 al 6. Obligatorio.'],
    ['SECCION',            'Una letra: A, B, C… Obligatorio.'],
    ['CODIGO_ESTUDIANTE',  'Código SIAGIE. Opcional.'],
    ['ESTADO',             'DEFINITIVA (por defecto) | RETIRADO | EGRESADO | TRASLADADO. Opcional.'],
    ['', ''],
    ['Contraseña inicial', 'Últimos 6 dígitos del DNI del alumno.'],
    ['Formato aceptado',   'Excel (.xlsx) o CSV (separado por coma o punto y coma).'],
    ['Año académico',      'Se establece al momento de importar en el formulario.'],
  ];

  instrucciones.forEach(([col, val], i) => {
    const row = info.addRow([col, val]);
    if (i === 0) {
      row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1B4B' } };
      row.height = 20;
    } else {
      row.getCell(1).font = { bold: true, color: { argb: 'FF374151' } };
      row.getCell(2).font = { color: { argb: 'FF6B7280' } };
    }
    row.eachCell(cell => { cell.alignment = { vertical: 'middle', wrapText: true }; });
    if (i > 0) row.height = 16;
  });

  // ── Serializar ─────────────────────────────────────────────────
  const buf = await wb.xlsx.writeBuffer();

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-alumnos.xlsx"',
    },
  });
}
