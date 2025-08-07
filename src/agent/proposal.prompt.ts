import { ChatPromptTemplate } from '@langchain/core/prompts';

export const proposalPrompt = ChatPromptTemplate.fromTemplate(`
You're helping write a comprehensive web development proposal.
The user said: "{userInput}"

Please provide detailed, professional content that can be included in a proposal. Structure it with these sections:

1. Project Overview - A compelling overview of the project that demonstrates understanding and value proposition
2. Scope of Work- Detailed deliverables and what's included
3. Technical Approach - Technologies and methodologies to be used
4. Timeline Estimates - Project phases and milestones{timelineNote}
5. Budget Estimates- Detailed cost breakdown{budgetNote}
6. Next Steps- What happens after proposal acceptance

{requirementsNote}

IMPORTANT FORMATTING RULES:
- Use bullet points in each section data except project overview
- Section headers should be exactly: "Project Overview", "Scope of Work", "Technical Approach", "Timeline Estimates", "Budget Estimates", "Next Steps" and bold
- Make the Project Overview compelling and business-focused
_ At last must be a signature section for acceptance
- Keep content professional and detailed

Current draft so far: {draft}
`);
