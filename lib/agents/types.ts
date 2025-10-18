import { Experimental_Agent as Agent } from 'ai';

export type AgentType =
  | 'balance_lookup'
  | 'transaction_detail'
  | 'address_analysis'
  | 'complex_analysis'
  | 'out_of_scope';

export type AgentConfig = {
  model: any;
  system: string;
  tools: Record<string, any>;
  stopWhen?: any;
};

export interface IAgentFactory {
  createAgent(
    tools?: Record<string, any>,
  ): Agent<Record<string, any>, never, never>;
}
