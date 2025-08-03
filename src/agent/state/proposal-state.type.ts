import { Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';

export const StateAnnotation = Annotation.Root({
  userInput: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  draft: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  pdfReady: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  message: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  pdfBuffer: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  title: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  history: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),

  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  userTimeline: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  userBudget: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  userRequirements: Annotation<string[]>({
    reducer: (x, y) => [...(x || []), ...(y || [])],
    default: () => [],
  }),
});
