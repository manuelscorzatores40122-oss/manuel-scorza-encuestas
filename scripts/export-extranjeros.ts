import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

function derivarClave(doc: string): string {
  const digits = doc.replace(/\D/g, '');
  if (digits.length >= 6) return digits.slice(-6);
  return digits.padStart(6, '0');
}

async function main() {
  const students = await prisma.student.findMany({
    orderBy: [{ apellidoPaterno: 'asc' }],
    select: {
      dni: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      nombres: true,
      section: { select: { name: true, grade: { select: { name: true, nivel: true } } } },
      apoderados: {
        select: { apellidosNombres: true, celular: true, parentesco: true },
      },
    },
  });

  const extranjeros = students.filter(s => s.dni.replace(/\D/g, '').length !== 8);

  const rows: string[] = [
    'N°,APELLIDOS Y NOMBRES,NIVEL,GRADO,SECCIÓN,USUARIO (LOGIN),CONTRASEÑA,APODERADO,CELULAR',
  ];

  extranjeros.forEach((s, i) => {
    const nivel  = s.section.grade.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria';
    const grado  = s.section.grade.name;
    const clave  = derivarClave(s.dni);
    const apod   = s.apoderados[0];
    const apodNombre = apod?.apellidosNombres || '—';
    const cel    = apod?.celular || '—';

    rows.push([
      i + 1,
      `"${s.apellidoPaterno} ${s.apellidoMaterno}, ${s.nombres}"`,
      nivel,
      grado,
      s.section.name,
      s.dni,
      clave,
      `"${apodNombre}"`,
      cel,
    ].join(','));
  });

  const csv = rows.join('\n');
  const out = 'credenciales-extranjeros-2026.csv';
  fs.writeFileSync(out, csv, 'utf8');
  console.log(`\n✅ ${extranjeros.length} estudiantes extranjeros → ${out}\n`);
  console.log(rows.join('\n'));
}

main().catch(console.error).finally(() => prisma.$disconnect());
