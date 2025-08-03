import { Injectable } from '@nestjs/common';
import { buildProposalGraph } from './proposal.graph';

@Injectable()
export class ProposalService {
  private graph = buildProposalGraph();
  private history: string[] = [];
  private fullDraft = '';
  private title = '';
  private userTimeline = '';
  private userBudget = '';
  private userRequirements: string[] = [];

  async interact(
    userInput: string,
  ): Promise<{ reply: string; pdfBuffer?: Buffer }> {
    const result = await this.graph.invoke({
      userInput,
      history: this.history,
      draft: this.fullDraft,
      title: this.title,
      userTimeline: this.userTimeline,
      userBudget: this.userBudget,
      userRequirements: this.userRequirements,
    });

    this.history = result.history ?? this.history;
    this.fullDraft = result.draft ?? this.fullDraft;
    this.title = result.title ?? this.title;
    this.userTimeline = result.userTimeline ?? this.userTimeline;
    this.userBudget = result.userBudget ?? this.userBudget;
    this.userRequirements = result.userRequirements ?? this.userRequirements;

    if (result.pdfReady && result.pdfBuffer) {
      return {
        reply: result.message,
        pdfBuffer: result.pdfBuffer,
      };
    }

    return { reply: result.message };
  }

  reset() {
    this.history = [];
    this.fullDraft = '';
    this.title = '';
    this.userTimeline = '';
    this.userBudget = '';
    this.userRequirements = [];
  }

  getCurrentDraft(): string {
    return this.fullDraft;
  }

  getHistory(): string[] {
    return this.history;
  }
}
