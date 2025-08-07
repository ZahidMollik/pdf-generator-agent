import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { generateDoc } from '../utils/doc-generator';

export const generateProposalTool = tool(
  async ({ title, content }) => {
    try {
      const buffer = await generateDoc(title, content);
      return buffer;
    } catch (error) {
      console.error('Error generating document:', error);
      throw new Error(`Failed to generate document: ${error.message}`);
    }
  },
  {
    name: 'generate_proposal_doc',
    description: 'Generates a DOC file for the web development proposal.',
    schema: z.object({
      content: z.string().describe('The proposal content'),
      title: z.string().describe('Title of the proposal'),
    }),
  },
);
