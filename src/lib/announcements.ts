import { prisma } from './prisma';

export type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  targetRoles: string[];
  isPublished: boolean;
  createdAt: Date;
  createdBy: { fullName: string };
};

/* ── Lista con autor (paneles admin/director/psicologo) ── */
export async function listAnnouncements(limit = 50): Promise<AnnouncementRow[]> {
  const rows = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id:          true,
      title:       true,
      content:     true,
      targetRoles: true,
      isPublished: true,
      createdAt:   true,
      createdBy:   { select: { fullName: true } },
    },
  });
  return rows;
}

/* ── Lista para el estudiante (solo visibles para su rol) ── */
export async function listPublishedAnnouncementsFor(role: string, limit = 100) {
  return prisma.announcement.findMany({
    where: {
      isPublished: true,
      OR: [
        { targetRoles: { has: role } },
        { targetRoles: { isEmpty: true } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id:          true,
      title:       true,
      content:     true,
      targetRoles: true,
      isPublished: true,
      createdAt:   true,
      createdById: true,
    },
  });
}

/* ── CRUD ── */
export async function createAnnouncement(input: {
  id:          string;
  title:       string;
  content:     string;
  targetRoles: string[];
  createdById: string;
}) {
  await prisma.announcement.create({
    data: {
      id:          input.id,
      title:       input.title,
      content:     input.content,
      targetRoles: input.targetRoles,
      isPublished: true,
      createdById: input.createdById,
    },
  });
}

export async function toggleAnnouncement(id: string) {
  const current = await prisma.announcement.findUnique({
    where:  { id },
    select: { isPublished: true },
  });
  if (!current) return;
  await prisma.announcement.update({
    where: { id },
    data:  { isPublished: !current.isPublished },
  });
}

export async function deleteAnnouncement(id: string) {
  await prisma.announcement.delete({ where: { id } });
}
