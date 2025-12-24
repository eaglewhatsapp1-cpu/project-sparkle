import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

export interface ExportData {
  question: string;
  response: string;
  timestamp: Date;
  id: string;
  projectName: string;
}

export const generateExportId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const exportToText = (data: ExportData) => {
  const content = `
${data.projectName} - AI Analysis Report
Generated: ${data.timestamp.toLocaleString()}
ID: ${data.id}

Question:
${data.question}

Response:
${data.response}
`.trim();

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `analysis-${data.id}.txt`);
};

export const exportToPDF = (data: ExportData) => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;

  doc.setFontSize(16);
  doc.text(data.projectName, margin, margin);

  doc.setFontSize(10);
  doc.text(`Generated: ${data.timestamp.toLocaleString()}`, margin, margin + 10);

  doc.setFontSize(12);
  doc.text('Question:', margin, margin + 25);
  doc.setFontSize(10);
  const questionLines = doc.splitTextToSize(data.question, maxWidth);
  doc.text(questionLines, margin, margin + 35);

  const questionHeight = questionLines.length * 5;
  doc.setFontSize(12);
  doc.text('Response:', margin, margin + 45 + questionHeight);
  doc.setFontSize(10);
  const responseLines = doc.splitTextToSize(data.response, maxWidth);
  doc.text(responseLines, margin, margin + 55 + questionHeight);

  doc.save(`analysis-${data.id}.pdf`);
};

export const exportToWord = async (data: ExportData) => {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: data.projectName,
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated: ${data.timestamp.toLocaleString()}`,
                size: 20,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Question:',
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: data.question,
                size: 22,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Response:',
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: data.response,
                size: 22,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `analysis-${data.id}.docx`);
};
