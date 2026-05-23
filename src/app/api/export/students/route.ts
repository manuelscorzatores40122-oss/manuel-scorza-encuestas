import ExcelJS from 'exceljs';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN']);
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const sp      = req.nextUrl.searchParams;
  const nivel   = sp.get('nivel')   || '';
  const gradoId = sp.get('gradoId') || '';
  const seccionId = sp.get('seccionId') || '';
  const estado  = sp.get('estado')  || '';
  const anio    = sp.get('anio')    || '';
  const formato = sp.get('formato') || 'xlsx';

  // ── Filtros ────────────────────────────────────────────────────
  const where: any = {};
  if (estado)   where.estadoMatricula = estado;
  if (anio)     where.anioAcademico   = Number(anio);
  if (seccionId) {
    where.sectionId = seccionId;
  } else if (gradoId) {
    where.section = { gradeId: gradoId };
  } else if (nivel) {
    where.section = { grade: { nivel } };
  }

  const students = await prisma.student.findMany({
    where,
    orderBy: [
      { section: { grade: { nivel: 'asc' } } },
      { section: { grade: { order: 'asc' } } },
      { section: { name: 'asc' } },
      { apellidoPaterno: 'asc' },
      { apellidoMaterno: 'asc' },
    ],
    include: {
      section: { include: { grade: true } },
      user: { select: { username: true, isActive: true, lastLogin: true } },
      apoderados: {
        where: { esContactoPrincipal: true },
        take: 1,
        select: { apellidosNombres: true, celular: true, correo: true, parentesco: true },
      },
    },
  });

  // ── Excel ──────────────────────────────────────────────────────
  if (formato !== 'csv') {
    const wb    = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Estudiantes');

    sheet.columns = [
      { header: 'N°',                  key: 'num',         width: 5  },
      { header: 'DNI',                 key: 'dni',         width: 11 },
      { header: 'Código',              key: 'codigo',      width: 14 },
      { header: 'Apellido Paterno',    key: 'apPat',       width: 20 },
      { header: 'Apellido Materno',    key: 'apMat',       width: 20 },
      { header: 'Nombres',             key: 'nombres',     width: 25 },
      { header: 'Sexo',                key: 'sexo',        width: 7  },
      { header: 'Fecha Nacimiento',    key: 'fechaNac',    width: 16 },
      { header: 'Edad',                key: 'edad',        width: 6  },
      { header: 'Nivel',               key: 'nivel',       width: 12 },
      { header: 'Grado',               key: 'grado',       width: 8  },
      { header: 'Sección',             key: 'seccion',     width: 9  },
      { header: 'Estado',              key: 'estado',      width: 14 },
      { header: 'Año Académico',       key: 'anio',        width: 14 },
      { header: 'Usuario (login)',     key: 'username',    width: 14 },
      { header: 'Activo',              key: 'activo',      width: 8  },
      { header: 'Último acceso',       key: 'lastLogin',   width: 18 },
      { header: 'Apoderado',           key: 'apoderado',   width: 28 },
      { header: 'Parentesco',          key: 'parentesco',  width: 13 },
      { header: 'Celular Apoderado',   key: 'celular',     width: 16 },
      { header: 'Correo Apoderado',    key: 'correo',      width: 26 },
    ];

    // Estilo header
    const hRow = sheet.getRow(1);
    hRow.height = 22;
    hRow.eachCell(cell => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1B4B' } };
      cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const NIVEL_LABEL: Record<string, string> = { PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' };
    const ESTADO_LABEL: Record<string, string> = {
      DEFINITIVA: 'Definitiva', RETIRADO: 'Retirado', EGRESADO: 'Egresado', TRASLADADO: 'Trasladado',
    };

    students.forEach((s, i) => {
      const ap = s.apoderados[0];
      const row = sheet.addRow({
        num:        i + 1,
        dni:        s.dni,
        codigo:     s.codigoEstudiante || '',
        apPat:      s.apellidoPaterno,
        apMat:      s.apellidoMaterno,
        nombres:    s.nombres,
        sexo:       s.sexo,
        fechaNac:   s.fechaNacimiento
                      ? `${s.fechaNacimiento.getDate().toString().padStart(2,'0')}/${(s.fechaNacimiento.getMonth()+1).toString().padStart(2,'0')}/${s.fechaNacimiento.getFullYear()}`
                      : '',
        edad:       s.edad,
        nivel:      NIVEL_LABEL[s.section.grade.nivel] || s.section.grade.nivel,
        grado:      s.section.grade.name,
        seccion:    s.section.name,
        estado:     ESTADO_LABEL[s.estadoMatricula] || s.estadoMatricula,
        anio:       s.anioAcademico,
        username:   s.user?.username || '',
        activo:     s.user?.isActive ? 'Sí' : 'No',
        lastLogin:  s.user?.lastLogin
                      ? s.user.lastLogin.toLocaleString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
                      : 'Nunca',
        apoderado:  ap?.apellidosNombres || '',
        parentesco: ap?.parentesco || '',
        celular:    ap?.celular || '',
        correo:     ap?.correo || '',
      });

      row.height = 16;
      row.eachCell(cell => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? 'FFFAFAFA' : 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle' };
        cell.font      = { size: 9 };
      });
    });

    // Fila total
    const totRow = sheet.addRow({ num: '', dni: `Total: ${students.length} registros` });
    totRow.getCell('dni').font = { bold: true, size: 9 };

    const date    = new Date().toISOString().slice(0, 10);
    const buf     = await wb.xlsx.writeBuffer();
    const sufijo  = [nivel, gradoId ? `grado` : '', seccionId ? `sec` : ''].filter(Boolean).join('-') || 'todos';
    const fname   = `estudiantes-${sufijo}-${date}.xlsx`;

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fname}"`,
      },
    });
  }

  // ── CSV ────────────────────────────────────────────────────────
  const COLS = ['N°','DNI','Código','Apellido Paterno','Apellido Materno','Nombres','Sexo',
    'Fecha Nacimiento','Edad','Nivel','Grado','Sección','Estado','Año Académico',
    'Usuario','Activo','Último acceso','Apoderado','Parentesco','Celular Apoderado','Correo Apoderado'];

  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const lines = [
    COLS.join(';'),
    ...students.map((s, i) => {
      const ap = s.apoderados[0];
      return [
        i + 1,
        s.dni,
        s.codigoEstudiante || '',
        s.apellidoPaterno, s.apellidoMaterno, s.nombres, s.sexo,
        s.fechaNacimiento
          ? `${s.fechaNacimiento.getDate().toString().padStart(2,'0')}/${(s.fechaNacimiento.getMonth()+1).toString().padStart(2,'0')}/${s.fechaNacimiento.getFullYear()}`
          : '',
        s.edad,
        s.section.grade.nivel, s.section.grade.name, s.section.name,
        s.estadoMatricula, s.anioAcademico,
        s.user?.username || '',
        s.user?.isActive ? 'Sí' : 'No',
        s.user?.lastLogin ? s.user.lastLogin.toLocaleString('es-PE') : 'Nunca',
        ap?.apellidosNombres || '', ap?.parentesco || '', ap?.celular || '', ap?.correo || '',
      ].map(esc).join(';');
    }),
  ];

  const csv   = '﻿' + lines.join('\n');
  const date  = new Date().toISOString().slice(0, 10);
  const fname = `estudiantes-${date}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fname}"`,
    },
  });
}
