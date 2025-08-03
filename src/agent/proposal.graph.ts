import { ChatGroq } from '@langchain/groq';
import { END, START, StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { AIMessage, ToolMessage } from '@langchain/core/messages';
import * as dotenv from 'dotenv';

import { generateProposalTool } from './proposal.tool';
import { StateAnnotation } from './state/proposal-state.type';
import { extractUserPreferences } from './extractUserPreferences';
import { proposalPrompt } from './proposal.prompt';

dotenv.config();

const llm = new ChatGroq({
  model: 'llama3-8b-8192',
  temperature: 0.3,
  apiKey: process.env.GROQ_API_KEY,
});

export const buildProposalGraph = () => {
  const builder = new StateGraph(StateAnnotation)
    .addNode('generatePdfTool', new ToolNode([generateProposalTool]))
    .addNode('processRequest', async (state: typeof StateAnnotation.State) => {
      const lower = state.userInput.toLowerCase();
      const wantsPdf =
        lower.includes('make pdf') || lower.includes('generate pdf');

      if (wantsPdf) {
        const draftContent = state.draft || '';
        const title = state.title;

        console.log('📄 PDF Generation - Title:', title);
        console.log('📄 PDF Generation - Content length:', draftContent.length);

        if (!draftContent.trim()) {
          return {
            ...state,
            message:
              'No proposal content available. Please chat about your project first before generating a PDF.',
            pdfReady: false,
          };
        }

        return {
          ...state,
          message: '🛠 Generating your proposal PDF...',
          messages: [
            new AIMessage({
              content: '',
              tool_calls: [
                {
                  name: 'generate_proposal_pdf',
                  args: {
                    content: draftContent,
                    title: title,
                    date: new Date().toLocaleDateString(),
                  },
                  id: 'pdf_generation_call',
                },
              ],
            }),
          ],
        };
      } else {
        const extractedInfo = extractUserPreferences(state.userInput);
        console.log('Extracted info:', extractedInfo);

        const timelineContext =
          state.userTimeline || extractedInfo.timeline
            ? `Timeline requirement: ${state.userTimeline || extractedInfo.timeline}`
            : '';

        const budgetContext =
          state.userBudget || extractedInfo.budget
            ? `Budget constraint: ${state.userBudget || extractedInfo.budget}`
            : '';

        const requirementsContext =
          [...(state.userRequirements || []), ...extractedInfo.requirements]
            .length > 0
            ? `Specific requirements: ${[...(state.userRequirements || []), ...extractedInfo.requirements].join(', ')}`
            : '';

        // Determine the best title to use
        let titleContext = '';
        if (extractedInfo.title) {
          // New title extracted from current input
          titleContext = `${extractedInfo.title} - Development Proposal`;
          console.log('✅ Using newly extracted title:', titleContext);
        } else if (state.title && state.title !== 'Web Development Proposal') {
          // Use existing title from state if it's not the default
          titleContext = state.title;
          console.log('✅ Using existing title from state:', titleContext);
        } else {
          // Try to infer from user input if no explicit title
          const inferredTitle = state.userInput.match(
            /\b([A-Z][a-zA-Z0-9\s]+)\b/,
          )?.[1];
          if (inferredTitle && inferredTitle.length > 3) {
            titleContext = `${inferredTitle} - Development Proposal`;
            console.log('✅ Using inferred title:', titleContext);
          } else {
            titleContext = 'Web Development Proposal';
            console.log('⚠️  Using default title:', titleContext);
          }
        }

        const chatHistory = state.history ?? [];
        const userMessage = state.userInput;

        try {
          const promptInput = {
            userInput: state.userInput || '',
            draft: state.draft || 'Starting new proposal...',
            timelineNote: timelineContext
              ? ` (IMPORTANT: Use this timeline: ${timelineContext})`
              : ' (use realistic estimates)',
            budgetNote: budgetContext
              ? ` (IMPORTANT: Structure pricing around this budget: ${budgetContext})`
              : ' (use placeholder values like $X, $Y)',
            requirementsNote: requirementsContext
              ? `IMPORTANT: Incorporate these specific requirements into the proposal: ${requirementsContext}`
              : '',
          };

          const messages = await proposalPrompt.formatMessages(promptInput);
          const response = await llm.invoke(messages);

          const responseContent =
            typeof response.content === 'string'
              ? response.content
              : String(response.content) || 'No response generated';

          return {
            ...state,
            title: titleContext,
            draft: responseContent,
            history: [...chatHistory, userMessage, responseContent],
            message: responseContent,
            pdfReady: false,
            userTimeline: state.userTimeline || extractedInfo.timeline,
            userBudget: state.userBudget || extractedInfo.budget,
            userRequirements: [
              ...(state.userRequirements || []),
              ...extractedInfo.requirements,
            ],
          };
        } catch (error) {
          console.error('LLM Error:', error);
          return {
            ...state,
            message:
              'Error generating response. Please check your API key and try again.',
          };
        }
      }
    })
    .addNode('handlePdfResult', async (state: typeof StateAnnotation.State) => {
      const toolMessage = state.messages
        .slice()
        .reverse()
        .find((msg) => msg instanceof ToolMessage) as ToolMessage;

      if (!toolMessage || !toolMessage.content) {
        return {
          ...state,
          message: 'Failed to generate PDF. No result returned.',
          pdfReady: false,
        };
      }

      let pdfBuffer: any = toolMessage.content;

      // Handle different Buffer serialization formats
      if (typeof pdfBuffer === 'string') {
        try {
          const parsed = JSON.parse(pdfBuffer);
          if (parsed.type === 'Buffer' && Array.isArray(parsed.data)) {
            pdfBuffer = Buffer.from(parsed.data);
          } else {
            console.error('Unexpected JSON structure:', parsed);
          }
        } catch (e) {
          console.error('Failed to parse PDF buffer JSON:', e);
        }
      } else if (
        typeof pdfBuffer === 'object' &&
        pdfBuffer &&
        'type' in pdfBuffer &&
        pdfBuffer.type === 'Buffer' &&
        'data' in pdfBuffer &&
        Array.isArray(pdfBuffer.data)
      ) {
        pdfBuffer = Buffer.from(pdfBuffer.data);
      } else if (Buffer.isBuffer(pdfBuffer)) {
        console.log('PDF buffer is already a Buffer object');
      } else {
        console.error(
          'Unexpected PDF buffer type:',
          typeof pdfBuffer,
          pdfBuffer,
        );
      }

      console.log(
        'Final PDF buffer type:',
        typeof pdfBuffer,
        'isBuffer:',
        Buffer.isBuffer(pdfBuffer),
      );

      return {
        ...state,
        pdfBuffer: pdfBuffer,
        message: 'Proposal PDF generated successfully!',
        pdfReady: true,
      };
    })
    .addEdge(START, 'processRequest')
    .addConditionalEdges('processRequest', (state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      return lastMessage &&
        'tool_calls' in lastMessage &&
        Array.isArray(lastMessage.tool_calls) &&
        lastMessage.tool_calls.length > 0
        ? 'generatePdfTool'
        : END;
    })
    .addEdge('generatePdfTool', 'handlePdfResult')
    .addEdge('handlePdfResult', END);

  return builder.compile();
};
