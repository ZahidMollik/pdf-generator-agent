import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import * as fs from 'fs';

// Function to parse raw content into structured sections
function parseContent(
  rawContent: string,
): { header: string; body: string[] }[] {
  const sections: { header: string; body: string[] }[] = [];
  const blocks = rawContent.split(/\n(?=\*\*)/g); // split before next **Header**

  for (const block of blocks) {
    const headerMatch = block.match(/\*\*(.+?)\*\*/);
    if (!headerMatch) continue;

    const header = headerMatch[1].trim();
    const bodyText = block.replace(headerMatch[0], '').trim();
    const bodyLines = bodyText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');

    sections.push({ header, body: bodyLines });
  }

  return sections;
}

// Function to create a paragraph (12pt)
const createParagraph = (text: string): Paragraph => {
  return new Paragraph({
    children: [new TextRun({ text, size: 24 })],
  });
};

// Function to create a bullet list item
const createBullet = (text: string): Paragraph => {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { before: 100,after: 100 },
  });
};

// Function to generate the Word document
export async function generateDoc(
  title: string,
  rawContent: string,
  outputPath: string = `${title}-Proposal.docx`,
) {
  const parsedSections = parseContent(rawContent);

  const children: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 28 })],
      spacing: { after: 300 },
    }),
  ];

  for (const { header, body } of parsedSections) {
    children.push(
      new Paragraph({
        text: header,
        heading: HeadingLevel.HEADING_2,
        spacing: { before:200, after: 200 },
      }),
    );

    for (const line of body) {
      if (line.startsWith('•')) {
        children.push(createBullet(line.replace(/^•\s*/, '')));
      } else {
        children.push(createParagraph(line));
      }
    }
  }


  const doc = new Document({
    sections: [{ children }],
  });

  try {
    const buffer = await Packer.toBuffer(doc);
    // Only write to filesystem for debugging - the buffer is what gets returned
    if (outputPath && !outputPath.includes('/')) {
      // If relative path, write to project root for easier access
      const fullPath = `./output/${outputPath}`;
      fs.writeFileSync(fullPath, buffer);
      console.log(`✅ Document created: ${fullPath}`);
    }
    return buffer;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
}
