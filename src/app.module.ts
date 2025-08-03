import { Module } from '@nestjs/common';
import { ProposalController } from './agent/proposal.controller';
import { ProposalService } from './agent/proposal.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true,
    }),],
  controllers: [ProposalController],
  providers: [ProposalService],
})
export class AppModule {}
