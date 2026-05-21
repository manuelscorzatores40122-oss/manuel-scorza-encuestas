/**
 * Importador SIAGIE desde la línea de comandos.
 *
 * Uso:
 *   npm run import:siagie -- --file=ruta/al/archivo.xlsx --nivel=PRIMARIA --anio=2026
 */
import * as fs from 'fs';
import * as path from 'path';
import { Nivel } from '@prisma/client';
import { importSiagieExcel } from '../src/lib/siagie-importer';

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const file = args.file;
  const nivelStr = (args.nivel || 'PRIMARIA').toUpperCase();
  const anio = Number(args.anio || new Date().getFullYear());

  if (!file) {
    console.error('❌ Falta --file=ruta/al/archivo.xlsx');
    process.exit(1);
  }

  const fullPath = path.resolve(file);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ No existe el archivo: ${fullPath}`);
    process.exit(1);
  }

  if (!['PRIMARIA', 'SECUNDARIA'].includes(nivelStr)) {
    console.error('❌ --nivel debe ser PRIMARIA o SECUNDARIA');
    process.exit(1);
  }

  console.log(`📥 Importando ${file}`);
  console.log(`   Nivel: ${nivelStr}, Año: ${anio}\n`);

  const buffer = fs.readFileSync(fullPath);
  const result = await importSiagieExcel(buffer, nivelStr as Nivel, anio);

  console.log(`✅ Procesados:    ${result.total}`);
  console.log(`   Creados:       ${result.creados}`);
  console.log(`   Actualizados:  ${result.actualizados}`);
  console.log(`   Errores:       ${result.errores.length}\n`);

  if (result.errores.length > 0) {
    console.log('Errores:');
    for (const e of result.errores.slice(0, 20)) {
      console.log(`  · Fila ${e.fila}: ${e.razon}`);
    }
    if (result.errores.length > 20) console.log(`  · ...y ${result.errores.length - 20} más`);
  }

  if (result.credenciales.length > 0) {
    const csvPath = path.resolve(`credenciales-${nivelStr.toLowerCase()}-${anio}.csv`);
    const csv = ['DNI,Nombre,Clave', ...result.credenciales.map((c) => `${c.dni},"${c.nombre}",${c.clave}`)].join('\n');
    fs.writeFileSync(csvPath, '\uFEFF' + csv, 'utf8');
    console.log(`\n  Credenciales nuevas guardadas en: ${csvPath}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => {
    const { prisma } = await import('../src/lib/prisma');
    await prisma.$disconnect();
  });
