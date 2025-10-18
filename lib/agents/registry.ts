import { balanceAgentFactory } from './balance.agent';
import { transactionAgentFactory } from './transaction.agent';
import { addressAgentFactory } from './address.agent';
import { complexAgentFactory } from './complex.agent';
import { outOfScopeAgentFactory } from './out-of-scope.agent';
import type { AgentType, IAgentFactory } from './types';

/**
 * Central registry for all agent factories
 * Provides a single point of access for all agents
 */
class AgentRegistry {
  private registry: Map<AgentType, IAgentFactory>;

  constructor() {
    this.registry = new Map();
    this.registerDefaultAgents();
  }

  /**
   * Register all default agents
   */
  private registerDefaultAgents(): void {
    this.register('balance_lookup', balanceAgentFactory);
    this.register('transaction_detail', transactionAgentFactory);
    this.register('address_analysis', addressAgentFactory);
    this.register('complex_analysis', complexAgentFactory);
    this.register('out_of_scope', outOfScopeAgentFactory);
  }

  /**
   * Register a new agent factory
   */
  register(agentType: AgentType, factory: IAgentFactory): void {
    this.registry.set(agentType, factory);
    console.log(`[AgentRegistry] Registered agent: ${agentType}`);
  }

  /**
   * Get an agent factory by type
   */
  get(agentType: AgentType): IAgentFactory {
    const factory = this.registry.get(agentType);
    if (!factory) {
      throw new Error(
        `[AgentRegistry] Agent factory not found: ${agentType}. Available agents: ${Array.from(
          this.registry.keys(),
        ).join(', ')}`,
      );
    }
    return factory;
  }

  /**
   * Get all registered agent types
   */
  getAll(): AgentType[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Check if an agent is registered
   */
  has(agentType: AgentType): boolean {
    return this.registry.has(agentType);
  }

  /**
   * Get all registered factories (for advanced use)
   */
  getAllFactories(): Map<AgentType, IAgentFactory> {
    return new Map(this.registry);
  }
}

// Export singleton instance
export const agentRegistry = new AgentRegistry();

// Export the class for testing purposes
export { AgentRegistry };
