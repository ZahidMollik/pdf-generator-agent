import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import {
  generateProposalPDF,
  cleanContentForPDF,
} from '../utils/pdf-generator';

export const generateProposalTool = tool(
  async ({ title, content, date }) => {
    console.log('Generating PDF with:', {
      title: title?.substring(0, 50),
      contentLength: content?.length,
    });

    const cleaned = cleanContentForPDF(content);
    const buffer = generateProposalPDF({
      title,
      content: cleaned,
      date,
    });

    console.log(
      'Generated PDF buffer:',
      typeof buffer,
      'isBuffer:',
      Buffer.isBuffer(buffer),
      'size:',
      buffer?.length,
    );

    return buffer;
  },
  {
    name: 'generate_proposal_pdf',
    description: 'Generates a PDF for the web development proposal.',
    schema: z.object({
      content: z.string().describe('The proposal content'),
      title: z.string().describe('Title of the proposal'),
      date: z.string().describe('Proposal date (e.g., 08/03/2025)'),
    }),
  },
);
