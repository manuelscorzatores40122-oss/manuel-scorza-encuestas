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

type RawAnnouncementRow = {
  id: string;
  title: string;
  content: string;
  targetRoles: string[];
  isPublished: boolean;
  createdAt: Date;
  createdByName: string;
};

export async function listAnnouncements(limit = 50): Promise<AnnouncementRow[]> {
  const rows = await prisma.$queryRaw<RawAnnouncementRow[]>`
    SELECT
      a.id,
      a.title,
      a.content,
      a."targetRoles",
      a."isPublished",
      a."createdAt",
      u."fullName" AS "createdByName"
    FROM "Announcement" a
    INNER JOIN "User" u ON u.id = a."createdById"
    ORDER BY a."createdAt" DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    targetRoles: row.targetRoles,
    isPublished: row.isPublished,
    createdAt: row.createdAt,
    createdBy: { fullName: row.createdByName },
  }));
}

export async function listPublishedAnnouncementsFor(role: string, limit = 3) {
  return prisma.$queryRaw<Array<Omit<AnnouncementRow, 'createdBy'> & { createdById: string }>>`
    SELECT id, title, content, "targetRoles", "isPublished", "createdAt", "createdById"
    FROM "Announcement"
    WHERE "isPublished" = true
      AND (${role} = ANY("targetRoles") OR cardinality("targetRoles") = 0)
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `;
}

export async function createAnnouncement(input: {
  id: string;
  title: string;
  content: string;
  targetRoles: string[];
  createdById: string;
}) {
  await prisma.$executeRaw`
    INSERT INTO "Announcement" (
      id, title, content, "targetRoles", "isPublished", "createdById", "createdAt", "updatedAt"
    )
    VALUES (
      ${input.id},
      ${input.title},
      ${input.content},
      ${input.targetRoles}::text[],
      true,
      ${input.createdById},
      NOW(),
      NOW()
    )
  `;
}

export async function toggleAnnouncement(id: string) {
  await prisma.$executeRaw`
    UPDATE "Announcement"
    SET "isPublished" = NOT "isPublished", "updatedAt" = NOW()
    WHERE id = ${id}
  `;
}

export async function deleteAnnouncement(id: string) {
  await prisma.$executeRaw`DELETE FROM "Announcement" WHERE id = ${id}`;
}
