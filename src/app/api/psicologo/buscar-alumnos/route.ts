import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['PSYCHOLOGIST', 'ADMIN', 'AUXILIAR'].includes(session.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get('q') || '').trim().toUpperCase();
  if (q.length < 2) return NextResponse.json([]);

  const students = await prisma.student.findMany({
    where: {
      estadoMatricula: 'DEFINITIVA',
      OR: [
        { nombres:        { contains: q } },
        { apellidoPaterno:{ contains: q } },
        { apellidoMaterno:{ contains: q } },
      ],
    },
    select: {
      id: true,
      nombres: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      section: { select: { name: true, grade: { select: { name: true, nivel: true } } } },
      apoderados: {
        select: { apellidosNombres: true, celular: true, parentesco: true, esContactoPrincipal: true },
        take: 3,
      },
    },
    orderBy: { apellidoPaterno: 'asc' },
    take: 7,
  });

  return NextResponse.json(
    students.map((s) => {
      const contacto =
        s.apoderados.find((a) => a.esContactoPrincipal) ||
        s.apoderados.find((a) => a.parentesco === 'APODERADO') ||
        s.apoderados[0] ||
        null;

      return {
        id:            s.id,
        name:          `${s.apellidoPaterno} ${s.apellidoMaterno}, ${s.nombres}`,
        grade:         `${s.section.grade.name} — ${s.section.name}`,
        nivel:         s.section.grade.nivel,
        contactoNombre: contacto?.apellidosNombres ?? null,
        contactoCelular: contacto?.celular ?? null,
        contactoParentesco: contacto?.parentesco ?? null,
      };
    }),
  );
}
