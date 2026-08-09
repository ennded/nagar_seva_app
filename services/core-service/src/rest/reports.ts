import { Router, type Request, type Response } from 'express';
import { Types } from 'mongoose';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { verifyToken } from '../auth/jwt.js';
import { UserModel } from '../models/User.js';
import { REPORT_TYPES, buildReport, type ReportType } from '../services/report.service.js';

export const reportsRouter = Router();

// REST (not GraphQL) because these responses are binary file streams — mirrors the
// media-service pattern of decoding the core-service-issued JWT directly off the header
// rather than building a full GraphQL context.
//
// Admin and Nagaradhyaksh get every report city-wide. A Nagarsevak only gets
// department-performance, scoped to their own ward — the JWT doesn't carry the ward, so
// it's looked up from the DB.
async function requireReportAccess(
  req: Request,
  res: Response,
  type: ReportType,
): Promise<{ city: Types.ObjectId; ward?: Types.ObjectId } | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  const payload = verifyToken(header.slice('Bearer '.length));
  if (!payload) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  if (payload.role === 'admin' || payload.role === 'nagaradhyaksh') {
    return { city: new Types.ObjectId(payload.city) };
  }
  if (payload.role === 'nagarsevak' && type === 'department-performance') {
    const user = await UserModel.findById(payload.sub).select('ward');
    if (!user?.ward) {
      res.status(403).json({ error: 'No ward on file' });
      return null;
    }
    return { city: new Types.ObjectId(payload.city), ward: user.ward as unknown as Types.ObjectId };
  }
  res.status(403).json({ error: 'Not authorized for this report' });
  return null;
}

function isReportType(value: string): value is ReportType {
  return (REPORT_TYPES as readonly string[]).includes(value);
}

reportsRouter.get('/:type/pdf', async (req: Request, res: Response) => {
  const { type } = req.params;
  if (!isReportType(type)) {
    res.status(404).json({ error: 'Unknown report type' });
    return;
  }
  const auth = await requireReportAccess(req, res, type);
  if (!auth) return;

  const report = await buildReport(type, auth.city, auth.ward);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${type}.pdf"`);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(18).text(report.title, { align: 'left' });
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#555555').text(report.description);
  doc.moveDown(0.2);
  doc.fontSize(9).fillColor('#888888').text(`Generated ${new Date().toLocaleString()}`);
  doc.moveDown(1);
  doc.fillColor('#000000');

  const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / report.columns.length;
  const startX = doc.page.margins.left;

  function drawRow(cells: (string | number)[], y: number, bold: boolean) {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.5);
    cells.forEach((cell, i) => {
      doc.text(String(cell), startX + i * colWidth, y, { width: colWidth - 8 });
    });
  }

  let y = doc.y;
  drawRow(report.columns, y, true);
  y += 18;
  doc
    .moveTo(startX, y - 4)
    .lineTo(doc.page.width - doc.page.margins.right, y - 4)
    .strokeColor('#cccccc')
    .stroke();

  if (report.rows.length === 0) {
    doc.font('Helvetica').fontSize(9.5).fillColor('#888888').text('No data available for this report yet.', startX, y);
  }

  for (const row of report.rows) {
    if (y > doc.page.height - doc.page.margins.bottom - 20) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    drawRow(row, y, false);
    y += 18;
  }

  doc.end();
});

reportsRouter.get('/:type/xlsx', async (req: Request, res: Response) => {
  const { type } = req.params;
  if (!isReportType(type)) {
    res.status(404).json({ error: 'Unknown report type' });
    return;
  }
  const auth = await requireReportAccess(req, res, type);
  if (!auth) return;

  const report = await buildReport(type, auth.city, auth.ward);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(report.title.slice(0, 31));
  sheet.addRow([report.title]);
  sheet.addRow([report.description]);
  sheet.addRow([`Generated ${new Date().toLocaleString()}`]);
  sheet.addRow([]);
  const headerRow = sheet.addRow(report.columns);
  headerRow.font = { bold: true };
  for (const row of report.rows) sheet.addRow(row);
  sheet.columns.forEach((col) => {
    col.width = 22;
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${type}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
});
