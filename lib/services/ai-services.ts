import 'server-only';
import {
  streamText,
  generateText,
  convertToModelMessages,
  experimental_createMCPClient,
  UIMessage,
  Experimental_Agent as Agent,
  Output,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js';
import { mainnet } from 'viem/chains';
import { z } from 'zod';
import { agentRegistry, type AgentType } from '@/lib/agents';

// Define custom metadata type
type MessageMetadata = {
  agentType?: AgentType;
  chainId?: number;
  toolCount?: number;
  timestamp?: string;
};

// Define custom UIMessage type with metadata
type CustomUIMessage = UIMessage<MessageMetadata>;

// Router response schema - simpler version for experimental_output
const RouterResponseSchema = z.object({
  agent: z
    .enum([
      'balance_lookup',
      'transaction_detail',
      'address_analysis',
      'complex_analysis',
      'out_of_scope',
    ])
    .describe('The specialized agent best suited to handle this request'),
  chainId: z
    .number()
    .optional()
    .describe('The blockchain network ID if detected'),
  confidence: z
    .enum(['high', 'medium', 'low'])
    .describe('Confidence level in routing decision'),
  reasoning: z
    .string()
    .describe('Brief explanation of why this agent was chosen'),
  extractedEntities: z
    .object({
      addresses: z
        .array(z.string())
        .optional()
        .describe('Ethereum addresses found in query'),
      transactionHashes: z
        .array(z.string())
        .optional()
        .describe('Transaction hashes found'),
      tokens: z
        .array(z.string())
        .optional()
        .describe('Token symbols mentioned'),
    })
    .optional(),
});

type RouterResponse = z.infer<typeof RouterResponseSchema>;

class AIServices {
  private mcpClient: Awaited<
    ReturnType<typeof experimental_createMCPClient>
  > | null = null;
  private standardClient: McpClient | null = null;
  private tools: Record<string, any> = {};
  private agents: Map<AgentType, Agent<Record<string, any>, never, never>> =
    new Map();
  private isInitialized = false;

  /**
   * Initialize MCP clients and load tools
   * Call this once before using agents
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('[AIServices] Initializing MCP clients...');

    try {
      // Step 1: Unlock blockchain analysis
      const unlockTransport = new StreamableHTTPClientTransport(
        new URL('https://mcp.blockscout.com/mcp'),
      );

      this.standardClient = new McpClient({
        name: 'explorer-copilot',
        version: '1.0.0',
      });

      await this.standardClient.connect(unlockTransport);
      await this.standardClient.callTool({
        name: '__unlock_blockchain_analysis__',
        arguments: {},
      });
      console.log('[AIServices] Blockchain analysis unlocked');

      // Step 2: Create AI SDK MCP client
      const aiTransport = new StreamableHTTPClientTransport(
        new URL('https://mcp.blockscout.com/mcp'),
      );

      this.mcpClient = await experimental_createMCPClient({
        transport: aiTransport,
      });

      // Step 3: Load and filter tools
      const allTools = await this.mcpClient.tools();
      const { __unlock_blockchain_analysis__, ...tools } = allTools || {};
      this.tools = tools;

      console.log('[AIServices] Tools loaded:', Object.keys(this.tools).length);

      // Step 4: Pre-initialize all agents
      this.initializeAgents();

      this.isInitialized = true;
    } catch (error) {
      console.error('[AIServices] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize all specialized agents
   */
  private initializeAgents(): void {
    console.log('[AIServices] Initializing specialized agents...');

    // Balance Lookup Agent
    const balanceTools = this.getToolsForAgent('balance_lookup');
    this.agents.set(
      'balance_lookup',
      agentRegistry.get('balance_lookup').createAgent(balanceTools),
    );

    // Transaction Detail Agent
    const txTools = this.getToolsForAgent('transaction_detail');
    this.agents.set(
      'transaction_detail',
      agentRegistry.get('transaction_detail').createAgent(txTools),
    );

    // Address Analysis Agent
    const addressTools = this.getToolsForAgent('address_analysis');
    this.agents.set(
      'address_analysis',
      agentRegistry.get('address_analysis').createAgent(addressTools),
    );

    // Complex Analysis Agent
    const complexTools = this.getToolsForAgent('complex_analysis');
    this.agents.set(
      'complex_analysis',
      agentRegistry.get('complex_analysis').createAgent(complexTools),
    );

    // Out of Scope Agent
    this.agents.set(
      'out_of_scope',
      agentRegistry.get('out_of_scope').createAgent(),
    );

    console.log('[AIServices] All agents initialized');
  }

  /**
   * Clean up MCP clients
   */
  async cleanup(): Promise<void> {
    try {
      if (this.mcpClient) {
        await this.mcpClient.close();
        console.log('[AIServices] AI SDK client closed');
      }
      if (this.standardClient) {
        await this.standardClient.close();
        console.log('[AIServices] Standard client closed');
      }
    } catch (error) {
      console.error('[AIServices] Cleanup error:', error);
    } finally {
      this.isInitialized = false;
      this.mcpClient = null;
      this.standardClient = null;
      this.agents.clear();
    }
  }

  /**
   * Router Agent - Uses experimental_output for structured data generation
   * Returns the routing decision with confidence and reasoning
   */
  async routeRequest(messages: CustomUIMessage[]): Promise<RouterResponse> {
    console.log('[Router] Analyzing request with experimental_output...');

    // Get last user message content safely
    const lastMessage = messages[messages.length - 1];
    const lastContent =
      lastMessage.parts
        .filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join(' ') || '';

    // Extract entities for metadata
    const txHashPattern = /0x[a-fA-F0-9]{64}/g;
    const addressPattern = /0x[a-fA-F0-9]{40}/g;
    const txHashes = lastContent.match(txHashPattern) || [];
    const addresses = lastContent.match(addressPattern) || [];

    // Use experimental_output for structured routing decision
    try {
      const result = await generateText({
        model: openai('gpt-4o-mini'),
        system: `You are a routing agent that classifies blockchain queries.

Available agents:
- balance_lookup: Simple token balance and holdings queries for addresses
- transaction_detail: Transaction lookup, analysis, and verification
- address_analysis: In-depth wallet analysis, NFT holdings, transaction history
- complex_analysis: Multi-step queries, DeFi protocol analysis, comparative analysis
- out_of_scope: Questions unrelated to blockchain/crypto

Analyze the user's request and select the most appropriate agent.
You MUST return a JSON object with these EXACT fields:
- agent: one of the agent names above
- confidence: one of "high", "medium", or "low"
- reasoning: a brief explanation
- chainId (optional): blockchain network ID if detected
- extractedEntities (optional): any addresses, transaction hashes, or tokens found

CRITICAL: Use the exact field names "agent" and "confidence" (not "agentType").`,
        messages: convertToModelMessages(messages),
        experimental_output: Output.object({
          schema: RouterResponseSchema,
        }),
      });

      const routing = result.experimental_output;

      // Add extracted entities to the response
      if (txHashes.length > 0 || addresses.length > 0) {
        routing.extractedEntities = {
          ...(routing.extractedEntities || {}),
          transactionHashes: txHashes.length > 0 ? txHashes : undefined,
          addresses: addresses.length > 0 ? addresses : undefined,
        };
      }

      console.log('[Router] Classification:', {
        agent: routing.agent,
        confidence: routing.confidence,
        reasoning: routing.reasoning,
      });

      return routing;
    } catch (error) {
      console.error('[Router] Classification failed:', error);

      // Log the actual error for debugging
      if (error && typeof error === 'object' && 'text' in error) {
        console.error('[Router] Model output:', (error as any).text);
      }

      // Intelligent fallback based on content analysis
      const lowerContent = lastContent.toLowerCase();

      if (
        lowerContent.includes('balance') ||
        lowerContent.includes('how much')
      ) {
        return {
          agent: 'balance_lookup',
          chainId: mainnet.id,
          confidence: 'low',
          reasoning: 'Fallback: detected balance-related keywords',
          extractedEntities: addresses.length > 0 ? { addresses } : undefined,
        };
      }

      return {
        agent: 'complex_analysis',
        chainId: mainnet.id,
        confidence: 'low',
        reasoning:
          'Fallback: defaulting to complex analysis due to classification error',
      };
    }
  }

  /**
   * Get tools needed for specific agent type
   */
  private getToolsForAgent(agentType: AgentType): Record<string, any> {
    switch (agentType) {
      case 'balance_lookup':
        return Object.fromEntries(
          Object.entries(this.tools).filter(
            ([name]) =>
              name.includes('address') ||
              name.includes('balance') ||
              name.includes('token'),
          ),
        );

      case 'transaction_detail':
        return Object.fromEntries(
          Object.entries(this.tools).filter(
            ([name]) =>
              name.includes('transaction') ||
              name.includes('tx') ||
              name.includes('block'),
          ),
        );

      case 'address_analysis':
        return Object.fromEntries(
          Object.entries(this.tools).filter(
            ([name]) =>
              name.includes('address') ||
              name.includes('token') ||
              name.includes('nft'),
          ),
        );

      case 'complex_analysis':
        return this.tools;

      case 'out_of_scope':
        return {};

      default:
        return this.tools;
    }
  }

  /**
   * Get the appropriate agent based on routing decision
   */
  private getAgent(
    agentType: AgentType,
  ): Agent<Record<string, any>, never, never> {
    const agent = this.agents.get(agentType);
    if (!agent) {
      console.warn(
        `[AIServices] Agent ${agentType} not found, using complex_analysis`,
      );
      return this.agents.get('complex_analysis')!;
    }
    return agent;
  }

  /**
   * Main entry point - Routes and executes appropriate agent
   * Returns both the routing decision and the agent's stream
   */
  async processRequest(messages: CustomUIMessage[]) {
    // Ensure initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Validate messages
    if (!messages || messages.length === 0) {
      throw new Error('No messages provided');
    }

    // Route to appropriate agent using experimental_output
    const routing = await this.routeRequest(messages);

    console.log('[AIServices] Routing to agent:', {
      agent: routing.agent,
      confidence: routing.confidence,
      chainId: routing.chainId,
    });

    // Get the selected agent
    const agent = this.getAgent(routing.agent);

    // Stream the response with the selected agent
    const stream = agent.stream({
      messages: convertToModelMessages(messages),
    });

    // Return both routing info and stream
    return {
      routing,
      stream,
    };
  }

  /**
   * Alternative: Process request with routing metadata attached
   * This attaches routing info to the response metadata
   */
  async processRequestWithMetadata(messages: CustomUIMessage[]) {
    const { routing, stream } = await this.processRequest(messages);

    // You can add the routing info to response metadata
    return stream.toUIMessageStreamResponse({
      originalMessages: messages,
      messageMetadata: () => ({
        agentType: routing.agent,
        chainId: routing.chainId,
        timestamp: new Date().toISOString(),
      }),
      onFinish: ({ responseMessage, messages: allMessages }) => {
        console.log('[AIServices] Request completed:', {
          agent: routing.agent,
          confidence: routing.confidence,
          messageId: responseMessage.id,
        });
      },
    });
  }
}

// Export singleton instance
export const aiServices = new AIServices();

// Export types for use in other files
export type { CustomUIMessage, AgentType, RouterResponse };

/**
 * Helper function to format routing info for logging
 */
export function formatRoutingInfo(routing: RouterResponse): string {
  return `Agent: ${routing.agent} | Confidence: ${
    routing.confidence
  } | Chain: ${routing.chainId || 'N/A'}`;
}
