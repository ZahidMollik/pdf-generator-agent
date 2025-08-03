// src/utils/pdf-generator.ts

import { jsPDF } from 'jspdf';

export interface ProposalData {
  title: string;
  content: string;
  date?: string;
}

export function generateProposalPDF(proposalData: ProposalData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;

  let yPosition = margin;

  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const title = proposalData.title || 'Web Development Proposal';
  doc.text(title, margin, yPosition);
  yPosition += 15;

  // Add date
  if (proposalData.date) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${proposalData.date}`, margin, yPosition);
    yPosition += 10;
  }

  // Add content with proper text wrapping
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  // Split content into paragraphs and handle line breaks
  const paragraphs = proposalData.content.split('\n\n');

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) continue;

    // Handle markdown-style formatting
    let processedParagraph = paragraph
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .trim();

    // Check if this is a header (starts with # or is a section title)
    if (processedParagraph.startsWith('#')) {
      const headerLevel = (processedParagraph.match(/^#+/) || [''])[0].length;
      const headerText = processedParagraph.replace(/^#+\s*/, '');

      // Add extra space before headers
      yPosition += 5;

      // Set font size based on header level
      const fontSize = Math.max(16 - (headerLevel - 1) * 2, 12);
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');

      // Check if we need a new page
      if (yPosition + 10 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      doc.text(headerText, margin, yPosition);
      yPosition += fontSize * 0.8;

      // Reset to normal text
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      continue;
    }

    // Check if this is a section header (common section titles)
    const sectionHeaders = [
      'Project Overview',
      'Scope of Work',
      'Technical Approach',
      'Timeline Estimates',
      'Budget Estimates',
      'Next Steps',
      'Acceptance Criteria',
      'Acceptance Form',
    ];

    const isSectionHeader = sectionHeaders.some(
      (header) =>
        processedParagraph.trim().toLowerCase() === header.toLowerCase(),
    );

    if (isSectionHeader) {
      // Add extra space before section headers
      yPosition += 8;

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');

      // Check if we need a new page
      if (yPosition + 15 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      doc.text(processedParagraph.trim(), margin, yPosition);
      yPosition += 15;

      // Reset to normal text
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      continue;
    }

    // Handle bullet points - convert * or - to proper bullets
    if (
      processedParagraph.startsWith('*') ||
      processedParagraph.startsWith('-')
    ) {
      processedParagraph = '• ' + processedParagraph.substring(1).trim();
    }

    // Split text into lines that fit the page width
    const lines = doc.splitTextToSize(processedParagraph, maxWidth);

    // Check if we need a new page
    if (yPosition + lines.length * 5 > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    // Add the lines
    for (const line of lines) {
      doc.text(line, margin, yPosition);
      yPosition += 5;
    }

    // Add space between paragraphs
    yPosition += 3;
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

export function cleanContentForPDF(content: string): string {
  return (
    content
      // Remove multiple consecutive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Clean up any malformed markdown
      .replace(/\*{3,}/g, '**')
      // Remove any leading/trailing whitespace
      .trim()
  );
}
