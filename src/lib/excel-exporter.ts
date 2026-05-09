import ExcelJS from 'exceljs';
import { prisma } from './prisma';

export async function exportResponsesToExcel(filters: {
  surveyId?: string;
  gradeId?: string;
  sectionId?: string;
  riskLevel?: string;
  desde?: Date;
  hasta?: Date;
}): Promise<Buffer> {
  const where: any = {};
  if (filters.surveyId) where.surveyId = filters.surveyId;
  if (filters.riskLevel) where.riskLevel = filters.riskLevel;
  if (filters.desde || filters.hasta) {
    where.submittedAt = {};
    if (filters.desde) where.submittedAt.gte = filters.desde;
    if (filters.hasta) where.submittedAt.lte = filters.hasta;
  }
  if (filters.sectionId) where.student = { sectionId: filters.sectionId };
  else if (filters.gradeId) where.student = { section: { gradeId: filters.gradeId } };

  const responses = await prisma.response.findMany({
    where,
    include: {
      student: { include: { section: { include: { grade: true } } } },
      survey: true,
      answers: { include: { question: true } },
    },
    orderBy: { submittedAt: 'desc' },
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Respuestas');

  ws.columns = [
    { header: 'Fecha', key: 'fecha', width: 18 },
    { header: 'DNI', key: 'dni', width: 12 },
    { header: 'Estudiante', key: 'nombre', width: 35 },
    { header: 'Nivel', key: 'nivel', width: 12 },
    { header: 'Grado', key: 'grado', width: 8 },
    { header: 'Sección', key: 'seccion', width: 8 },
    { header: 'Encuesta', key: 'encuesta', width: 25 },
    { header: 'Score', key: 'score', width: 8 },
    { header: 'Riesgo', key: 'riesgo', width: 12 },
    { header: 'Quiere hablar', key: 'hablar', width: 14 },
    { header: 'Respuestas', key: 'respuestas', width: 80 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D8CFF' } };
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  for (const r of responses) {
    const respuestas = r.answers
      .map((a) => `${a.question.text}: ${a.value}`)
      .join(' | ');
    ws.addRow({
      fecha: r.submittedAt.toLocaleString('es-PE'),
      dni: r.student.dni,
      nombre: `${r.student.nombres} ${r.student.apellidoPaterno} ${r.student.apellidoMaterno}`,
      nivel: r.student.section.grade.nivel,
      grado: r.student.section.grade.name,
      seccion: r.student.section.name,
      encuesta: r.survey.title,
      score: r.riskScore,
      riesgo: r.riskLevel,
      hablar: r.wantsToTalk ? 'Sí' : 'No',
      respuestas,
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function exportCredencialesToExcel(
  credenciales: { dni: string; clave: string; nombre: string }[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Credenciales');
  ws.columns = [
    { header: 'DNI (usuario)', key: 'dni', width: 15 },
    { header: 'Nombre completo', key: 'nombre', width: 40 },
    { header: 'Clave inicial', key: 'clave', width: 15 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D8CFF' } };
  for (const c of credenciales) ws.addRow(c);
  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
