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

  const sp        = req.nextUrl.searchParams;
  const nivel     = sp.get('nivel')    || '';
  const gradoId   = sp.get('gradoId')  || '';
  const seccionId = sp.get('seccionId')|| '';
  const estado    = sp.get('estado')   || '';
  const anio      = sp.get('anio')     || '';
  const formato   = sp.get('formato')  || 'xlsx';

  // ── Filtros ────────────────────────────────────────────────────
  const where: any = {};
  if (estado)   where.estadoMatricula = estado;
  if (anio)     where.anioAcademico   = Number(anio);
  if (seccionId)      where.sectionId  = seccionId;
  else if (gradoId)   where.section    = { gradeId: gradoId };
  else if (nivel)     where.section    = { grade: { nivel } };

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
      user:    { select: { username: true, isActive: true, lastLogin: true } },
      apoderados: {
        select: {
          apellidosNombres: true,
          parentesco:       true,
          celular:          true,
          correo:           true,
          tipoDocumento:    true,
          numeroDocumento:  true,
          esContactoPrincipal: true,
        },
      },
    },
  });

  // ── Helpers ────────────────────────────────────────────────────
  type Ap = (typeof students)[0]['apoderados'][0];

  function byParentesco(aps: Ap[], tipo: string): Ap | undefined {
    // Primero el que sea contacto principal de ese tipo, luego cualquiera
    return aps.find(a => a.parentesco === tipo && a.esContactoPrincipal)
        ?? aps.find(a => a.parentesco === tipo);
  }

  const NIVEL_L:  Record<string,string> = { PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' };
  const ESTADO_L: Record<string,string> = {
    DEFINITIVA:'Definitiva', RETIRADO:'Retirado', EGRESADO:'Egresado', TRASLADADO:'Trasladado',
  };
  const PARENT_L: Record<string,string> = {
    PADRE:'Padre', MADRE:'Madre', APODERADO:'Apoderado/a', OTRO:'Otro',
  };

  function fmtFecha(d: Date | null) {
    if (!d) return '';
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
  }

  // ── EXCEL ──────────────────────────────────────────────────────
  if (formato !== 'csv') {
    const wb    = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Estudiantes');

    sheet.columns = [
      { header: 'N°',               key: 'num',         width: 5  },
      { header: 'DNI',              key: 'dni',         width: 11 },
      { header: 'Código',           key: 'codigo',      width: 14 },
      { header: 'Apellido Paterno', key: 'apPat',       width: 20 },
      { header: 'Apellido Materno', key: 'apMat',       width: 20 },
      { header: 'Nombres',          key: 'nombres',     width: 25 },
      { header: 'Sexo',             key: 'sexo',        width: 7  },
      { header: 'Fecha Nacimiento', key: 'fechaNac',    width: 16 },
      { header: 'Edad',             key: 'edad',        width: 6  },
      { header: 'Nivel',            key: 'nivel',       width: 12 },
      { header: 'Grado',            key: 'grado',       width: 8  },
      { header: 'Sección',          key: 'seccion',     width: 9  },
      { header: 'Estado',           key: 'estado',      width: 14 },
      { header: 'Año Académico',    key: 'anio',        width: 12 },
      { header: 'Usuario (login)',  key: 'username',    width: 14 },
      { header: 'Activo',           key: 'activo',      width: 8  },
      { header: 'Último acceso',    key: 'lastLogin',   width: 18 },
      // Padre
      { header: 'Padre · Nombre',      key: 'padNombre', width: 28 },
      { header: 'Padre · DNI',         key: 'padDni',    width: 12 },
      { header: 'Padre · Celular',     key: 'padCel',    width: 14 },
      { header: 'Padre · Correo',      key: 'padCorreo', width: 26 },
      // Madre
      { header: 'Madre · Nombre',      key: 'madNombre', width: 28 },
      { header: 'Madre · DNI',         key: 'madDni',    width: 12 },
      { header: 'Madre · Celular',     key: 'madCel',    width: 14 },
      { header: 'Madre · Correo',      key: 'madCorreo', width: 26 },
      // Apoderado/tutor legal
      { header: 'Apoderado · Nombre',  key: 'apoNombre', width: 28 },
      { header: 'Apoderado · DNI',     key: 'apoDni',    width: 12 },
      { header: 'Apoderado · Celular', key: 'apoCel',    width: 14 },
      { header: 'Apoderado · Correo',  key: 'apoCorreo', width: 26 },
      // Contacto principal (resumen)
      { header: 'Contacto principal',  key: 'ctaNombre', width: 28 },
      { header: 'Contacto · Celular',  key: 'ctaCel',    width: 14 },
    ];

    // ── Estilos de cabecera ──
    const hRow = sheet.getRow(1);
    hRow.height = 22;
    hRow.eachCell((cell, col) => {
      const isParent = col >= 18; // columnas de apoderados
      cell.fill      = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: isParent ? 'FF1E3A5F' : 'FF1E1B4B' },
      };
      cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    students.forEach((s, i) => {
      const aps  = s.apoderados;
      const pad  = byParentesco(aps, 'PADRE');
      const mad  = byParentesco(aps, 'MADRE');
      const apo  = byParentesco(aps, 'APODERADO') ?? byParentesco(aps, 'OTRO');
      const cta  = aps.find(a => a.esContactoPrincipal) ?? aps[0];

      const row = sheet.addRow({
        num:      i + 1,
        dni:      s.dni,
        codigo:   s.codigoEstudiante || '',
        apPat:    s.apellidoPaterno,
        apMat:    s.apellidoMaterno,
        nombres:  s.nombres,
        sexo:     s.sexo,
        fechaNac: fmtFecha(s.fechaNacimiento),
        edad:     s.edad,
        nivel:    NIVEL_L[s.section.grade.nivel] || s.section.grade.nivel,
        grado:    s.section.grade.name,
        seccion:  s.section.name,
        estado:   ESTADO_L[s.estadoMatricula] || s.estadoMatricula,
        anio:     s.anioAcademico,
        username: s.user?.username || '',
        activo:   s.user?.isActive ? 'Sí' : 'No',
        lastLogin: s.user?.lastLogin
          ? s.user.lastLogin.toLocaleString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
          : 'Nunca',
        // Padre
        padNombre: pad?.apellidosNombres || '',
        padDni:    pad?.numeroDocumento  || '',
        padCel:    pad?.celular          || '',
        padCorreo: pad?.correo           || '',
        // Madre
        madNombre: mad?.apellidosNombres || '',
        madDni:    mad?.numeroDocumento  || '',
        madCel:    mad?.celular          || '',
        madCorreo: mad?.correo           || '',
        // Apoderado
        apoNombre: apo?.apellidosNombres || '',
        apoDni:    apo?.numeroDocumento  || '',
        apoCel:    apo?.celular          || '',
        apoCorreo: apo?.correo           || '',
        // Contacto principal
        ctaNombre: cta ? `${PARENT_L[cta.parentesco] ?? cta.parentesco}: ${cta.apellidosNombres}` : '',
        ctaCel:    cta?.celular || '',
      });

      row.height = 16;
      const bg = i % 2 === 0 ? 'FFFAFAFA' : 'FFFFFFFF';
      row.eachCell(cell => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.alignment = { vertical: 'middle' };
        cell.font      = { size: 9 };
      });
    });

    // Fila de total
    const tot = sheet.addRow({ num: '', dni: `Total: ${students.length} registros` });
    tot.getCell('dni').font = { bold: true, size: 9 };

    const buf   = await wb.xlsx.writeBuffer();
    const date  = new Date().toISOString().slice(0, 10);
    const sufijo = [nivel, gradoId ? 'grado' : '', seccionId ? 'sec' : ''].filter(Boolean).join('-') || 'todos';

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="estudiantes-${sufijo}-${date}.xlsx"`,
      },
    });
  }

  // ── CSV ────────────────────────────────────────────────────────
  const COLS = [
    'N°','DNI','Código','Apellido Paterno','Apellido Materno','Nombres','Sexo',
    'Fecha Nacimiento','Edad','Nivel','Grado','Sección','Estado','Año Académico',
    'Usuario','Activo','Último acceso',
    'Padre Nombre','Padre DNI','Padre Celular','Padre Correo',
    'Madre Nombre','Madre DNI','Madre Celular','Madre Correo',
    'Apoderado Nombre','Apoderado DNI','Apoderado Celular','Apoderado Correo',
    'Contacto Principal','Contacto Celular',
  ];

  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const lines = [
    COLS.join(';'),
    ...students.map((s, i) => {
      const aps = s.apoderados;
      const pad = byParentesco(aps, 'PADRE');
      const mad = byParentesco(aps, 'MADRE');
      const apo = byParentesco(aps, 'APODERADO') ?? byParentesco(aps, 'OTRO');
      const cta = aps.find(a => a.esContactoPrincipal) ?? aps[0];

      return [
        i + 1, s.dni, s.codigoEstudiante || '',
        s.apellidoPaterno, s.apellidoMaterno, s.nombres, s.sexo,
        fmtFecha(s.fechaNacimiento), s.edad,
        s.section.grade.nivel, s.section.grade.name, s.section.name,
        s.estadoMatricula, s.anioAcademico,
        s.user?.username || '',
        s.user?.isActive ? 'Sí' : 'No',
        s.user?.lastLogin ? s.user.lastLogin.toLocaleString('es-PE') : 'Nunca',
        pad?.apellidosNombres||'', pad?.numeroDocumento||'', pad?.celular||'', pad?.correo||'',
        mad?.apellidosNombres||'', mad?.numeroDocumento||'', mad?.celular||'', mad?.correo||'',
        apo?.apellidosNombres||'', apo?.numeroDocumento||'', apo?.celular||'', apo?.correo||'',
        cta ? `${PARENT_L[cta.parentesco]??cta.parentesco}: ${cta.apellidosNombres}` : '',
        cta?.celular || '',
      ].map(esc).join(';');
    }),
  ];

  const date  = new Date().toISOString().slice(0, 10);
  return new NextResponse('﻿' + lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="estudiantes-${date}.csv"`,
    },
  });
}
