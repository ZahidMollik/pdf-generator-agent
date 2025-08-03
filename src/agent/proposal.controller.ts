import { Controller, Post, Body, Res, Get } from '@nestjs/common';
import { ProposalService } from './proposal.service';
import { Response } from 'express';

@Controller('chat-proposal')
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post()
  async chat(@Body('message') message: string, @Res() res: Response) {
    try {
      const result = await this.proposalService.interact(message);

      if (result.pdfBuffer) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename=web-development-proposal.pdf',
        );
        res.setHeader('Content-Length', result.pdfBuffer.length);
        res.send(result.pdfBuffer);
      } else {
        res.json({ reply: result.reply });
      }
    } catch (error) {
      console.error('Error in chat endpoint:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process your request. Please try again.',
      });
    }
  }

  @Post('reset')
  reset() {
    this.proposalService.reset();
    return { message: 'Session reset successfully' };
  }

  @Get('draft')
  getCurrentDraft() {
    return {
      draft: this.proposalService.getCurrentDraft(),
      history: this.proposalService.getHistory(),
    };
  }
}
