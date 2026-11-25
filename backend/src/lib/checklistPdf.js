import PDFDocument from 'pdfkit';
import { categoriesData, siteData } from '../shared.js';

const NAVY = '#101d32';
const RED = '#d20a16';
const BODY = '#344054';
const MUTED = '#667085';
const LINE = '#d6dee8';

/** Streams a branded, printable certification checklist for one product category. */
export function writeChecklistPdf(slug, stream) {
  const cat = categoriesData.categories.find((c) => c.slug === slug);
  if (!cat) return false;

  const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `DVGW Certification Checklist – ${cat.name}`, Author: siteData.company.name } });
  doc.pipe(stream);
  const W = doc.page.width;
  const left = 50;
  const width = W - 100;

  // Header band
  doc.rect(0, 0, W, 92).fill(NAVY);
  doc.rect(0, 0, 6, 92).fill(RED);
  doc.font('Helvetica-Bold').fontSize(26).fillColor(RED).text('ESC', left, 30, { continued: false });
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff').text('UTILITY SERVICES', left + 62, 33);
  doc.font('Helvetica').fontSize(9).fillColor('#c8d3e3').text(siteData.company.division, left + 62, 46);
  doc.font('Helvetica').fontSize(9).fillColor('#c8d3e3').text('Certification Checklist', left, 38, { width, align: 'right' });

  doc.moveDown(0);
  doc.y = 120;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(RED).text('DVGW CERTIFICATION · REQUIRED DOCUMENTS', left);
  doc.moveDown(0.4);
  doc.font('Helvetica-Bold').fontSize(22).fillColor(NAVY).text(cat.name, left);
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(10.5).fillColor(BODY).text(cat.summary, { width });
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(`Typical duration: ${cat.timeline} · Company: ____________________________ · Date: ______________`, { width });

  const section = (title) => {
    if (doc.y > doc.page.height - 140) doc.addPage();
    doc.moveDown(1.1);
    const y = doc.y;
    doc.rect(left, y, 3, 14).fill(RED);
    doc.font('Helvetica-Bold').fontSize(12.5).fillColor(NAVY).text(title, left + 10, y + 1);
    doc.moveDown(0.5);
  };

  const checkItem = (title, detail) => {
    if (doc.y > doc.page.height - 90) doc.addPage();
    const y = doc.y;
    doc.lineWidth(1).strokeColor(NAVY).rect(left, y + 1, 10, 10).stroke();
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(NAVY).text(title, left + 20, y, { width: width - 20 });
    if (detail) doc.font('Helvetica').fontSize(9).fillColor(BODY).text(detail, left + 20, doc.y + 1, { width: width - 20 });
    doc.moveDown(0.55);
  };

  section('1. Required documents checklist');
  categoriesData.commonDocuments.forEach((d) => checkItem(d.title, d.detail));
  section(`2. Additional documents for ${cat.name.toLowerCase()}`);
  cat.extraDocuments.forEach((d) => checkItem(d));

  section('3. Applicable rules & standards (indicative)');
  cat.standards.forEach((s) => {
    if (doc.y > doc.page.height - 80) doc.addPage();
    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY).text(s.code, left, doc.y, { continued: true });
    doc.font('Helvetica').fillColor(BODY).text(`  –  ${s.title}`, { width });
    doc.moveDown(0.3);
  });

  section('4. Preparation steps');
  cat.preparation.forEach((p, i) => {
    if (doc.y > doc.page.height - 80) doc.addPage();
    doc.font('Helvetica-Bold').fontSize(10).fillColor(RED).text(`${i + 1}.`, left, doc.y, { continued: true });
    doc.font('Helvetica').fillColor(BODY).text(`  ${p}`, { width });
    doc.moveDown(0.3);
  });

  section('5. Common mistakes to avoid');
  cat.mistakes.forEach((m) => {
    if (doc.y > doc.page.height - 80) doc.addPage();
    doc.font('Helvetica').fontSize(10).fillColor(BODY).text(`•  ${m}`, left, doc.y, { width });
    doc.moveDown(0.3);
  });

  // Footer note
  if (doc.y > doc.page.height - 130) doc.addPage();
  doc.moveDown(1.2);
  const y = doc.y;
  doc.lineWidth(0.5).strokeColor(LINE).moveTo(left, y).lineTo(left + width, y).stroke();
  doc.moveDown(0.6);
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text(
    'The applicable standards and test programme for your product are confirmed during the ESC feasibility assessment and by the certification body. ' +
      'This checklist is guidance and does not replace the requirements of the certification body. ESC is an independent consulting partner, not a certification body.',
    left,
    doc.y,
    { width },
  );
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY).text(`${siteData.company.name}  ·  ${siteData.company.email}  ·  ${siteData.company.phone}`, { width });

  doc.end();
  return true;
}
