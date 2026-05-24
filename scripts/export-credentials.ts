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
    orderBy: [
      { apellidoPaterno: 'asc' },
    ],
    select: {
      dni: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      nombres: true,
      section: {
        select: {
          name: true,
          grade: { select: { name: true, nivel: true, order: true } },
        },
      },
      apoderados: {
        select: { apellidosNombres: true, celular: true, parentesco: true },
        take: 1,
      },
    },
  });

  const rows: string[] = [
    'N°,APELLIDOS Y NOMBRES,NIVEL,GRADO,SECCIÓN,USUARIO (LOGIN),CONTRASEÑA,APODERADO,CELULAR APODERADO',
  ];

  students.forEach((s, i) => {
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
  fs.writeFileSync('scripts/credenciales-alumnos.csv', csv, 'utf8');

  console.log(`\n✅ ${students.length} alumnos exportados → scripts/credenciales-alumnos.csv\n`);

  // Mostrar primeros 10 como preview
  console.log(rows.slice(0, 11).join('\n'));
}

main().catch(console.error).finally(() => prisma.$disconnect());
