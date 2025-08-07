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
    .addNode('generateDocTool', new ToolNode([generateProposalTool]))
    .addNode('processRequest', async (state: typeof StateAnnotation.State) => {
      const lower = state.userInput.toLowerCase();
      const wantsDoc =
        lower.includes('make doc') ||
        lower.includes('generate doc')

      if (wantsDoc) {
        const draftContent = state.draft || '';
        const title = state.title;

        if (!draftContent.trim()) {
          return {
            ...state,
            message:
              'No proposal content available. Please generate a proposal first.',
            docReady: false,
          };
        }

        return {
          ...state,
          message: 'Generating your proposal DOC...',
          messages: [
            new AIMessage({
              content: '',
              tool_calls: [
                {
                  name: 'generate_proposal_doc',
                  args: {
                    content: draftContent,
                    title: title
                  },
                  id: 'doc_generation_call',
                },
              ],
            }),
          ],
        };
      } else {
        const extractedInfo = extractUserPreferences(state.userInput);

        const timelineContext =
          state.userTimeline || extractedInfo.timeline
            ? `Timeline: ${state.userTimeline || extractedInfo.timeline}`
            : '';

        const budgetContext =
          state.userBudget || extractedInfo.budget
            ? `Budget: ${state.userBudget || extractedInfo.budget}`
            : '';

        const requirementsContext =
          [...(state.userRequirements || []), ...extractedInfo.requirements]
            .length > 0
            ? `Requirements: ${[...(state.userRequirements || []), ...extractedInfo.requirements].join(', ')}`
            : '';

        // Determine title
        let titleContext = '';
        let projectNameContext = '';

        if (extractedInfo.title) {
          projectNameContext = extractedInfo.title;
          titleContext = `${extractedInfo.title} - Development Proposal`;
        } else if (state.projectName) {
          projectNameContext = state.projectName;
          titleContext = `${state.projectName} - Development Proposal`;
        } else {
          titleContext = state.title || 'Web Development Proposal';
        }

        const chatHistory = state.history ?? [];
        const userMessage = state.userInput;

        try {
          const promptInput = {
            userInput: state.userInput || '',
            draft: state.draft || 'Starting new proposal...',
            timelineNote: timelineContext
              ? ` (Timeline: ${timelineContext})`
              : '',
            budgetNote: budgetContext ? ` (Budget: ${budgetContext})` : '',
            requirementsNote: requirementsContext
              ? `Requirements: ${requirementsContext}`
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
            projectName: projectNameContext,
            draft: responseContent,
            history: [...chatHistory, userMessage, responseContent],
            message: responseContent,
            docReady: false,
            userTimeline: state.userTimeline || extractedInfo.timeline,
            userBudget: state.userBudget || extractedInfo.budget,
            userRequirements: [
              ...(state.userRequirements || []),
              ...extractedInfo.requirements,
            ],
          };
        } catch (error) {
          return {
            ...state,
            message: 'Error generating response. Please try again.',
          };
        }
      }
    })
    .addNode('handleDocResult', async (state: typeof StateAnnotation.State) => {
      const toolMessage = state.messages
        .slice()
        .reverse()
        .find((msg) => msg instanceof ToolMessage) as ToolMessage;

      if (!toolMessage?.content) {
        return {
          ...state,
          message: 'Failed to generate DOC.',
          docReady: false,
        };
      }

      let docBuffer: any = toolMessage.content;

      if (typeof docBuffer === 'string') {
        try {
          const parsed = JSON.parse(docBuffer);
          if (parsed.type === 'Buffer' && Array.isArray(parsed.data)) {
            docBuffer = Buffer.from(parsed.data);
          }
        } catch (e) {
          // Handle error silently
        }
      } else if (
        docBuffer?.type === 'Buffer' &&
        Array.isArray(docBuffer.data)
      ) {
        docBuffer = Buffer.from(docBuffer.data);
      }

      return {
        ...state,
        docBuffer: docBuffer,
        message: 'Proposal DOC generated successfully!',
        docReady: true,
      };
    })
    .addEdge(START, 'processRequest')
    .addConditionalEdges('processRequest', (state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      return lastMessage &&
        'tool_calls' in lastMessage &&
        Array.isArray(lastMessage.tool_calls) &&
        lastMessage.tool_calls.length > 0
        ? 'generateDocTool'
        : END;
    })
    .addEdge('generateDocTool', 'handleDocResult')
    .addEdge('handleDocResult', END);

  return builder.compile();
};
