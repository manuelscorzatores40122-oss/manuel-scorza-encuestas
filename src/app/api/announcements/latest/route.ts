import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const latest = await prisma.announcement.findFirst({
    where: { isPublished: true, OR: [{ targetRoles: { has: 'STUDENT' } }, { targetRoles: { isEmpty: true } }] },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, createdAt: true },
  });

  const count = await prisma.announcement.count({
    where: { isPublished: true, OR: [{ targetRoles: { has: 'STUDENT' } }, { targetRoles: { isEmpty: true } }] },
  });

  return NextResponse.json({ count, latestId: latest?.id ?? null, title: latest?.title ?? null });
}
