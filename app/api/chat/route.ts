import {
  streamText,
  convertToModelMessages,
  experimental_createMCPClient,
  stepCountIs,
} from 'ai';
// import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js';
import { makeBlockScoutSystemPrompt } from '@/lib/constants/system-prompts';
import { SUPPORTED_CHAINS } from '@/lib/config/chains';
import { mainnet } from 'viem/chains';

export async function POST(req: Request) {
  let mcpClient: Awaited<
    ReturnType<typeof experimental_createMCPClient>
  > | null = null;
  let standardClient: McpClient | null = null;

  try {
    console.log('[Chat API] Incoming request');
    const { messages } = await req.json();
    console.log('[Chat API] Messages:', messages.length);

    // Step 1: Unlock blockchain analysis using standard MCP client
    const unlockTransport = new StreamableHTTPClientTransport(
      new URL('https://mcp.blockscout.com/mcp'),
    );

    standardClient = new McpClient({
      name: 'explorer-copilot',
      version: '1.0.0',
    });

    await standardClient.connect(unlockTransport);
    await standardClient.callTool({
      name: '__unlock_blockchain_analysis__',
      arguments: {},
    });
    console.log('[MCP] Blockchain analysis unlocked');

    // Step 2: Create AI SDK MCP client
    const aiTransport = new StreamableHTTPClientTransport(
      new URL('https://mcp.blockscout.com/mcp'),
    );

    mcpClient = await experimental_createMCPClient({
      transport: aiTransport,
    });

    // Step 3: Load tools and filter out the unlock tool
    const allTools = await mcpClient.tools();
    const { __unlock_blockchain_analysis__, ...tools } = allTools || {};

    console.log('[MCP] Tools loaded:', Object.keys(tools).length);
    console.log('[MCP] Available tools:', Object.keys(tools).join(', '));

    const systemPrompt = makeBlockScoutSystemPrompt({
      toolNames: Object.keys(tools),
      defaultChainId: mainnet.id,
      supportedChains: SUPPORTED_CHAINS,
    });

    // Step 4: Stream the response
    const result = streamText({
      model: openai('gpt-4o-2024-11-20'),
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      tools: tools,
      stopWhen: stepCountIs(5),
      onFinish: async () => {
        console.log('[Chat API] Stream finished');
        // Close MCP clients after streaming is complete
        try {
          if (mcpClient) {
            await mcpClient.close();
            console.log('[MCP] AI SDK client closed');
          }
          if (standardClient) {
            await standardClient.close();
            console.log('[MCP] Standard client closed');
          }
        } catch (closeError) {
          console.error('[MCP] Error closing clients:', closeError);
        }
      },
      onError: async (error) => {
        console.error('[Chat API] Stream error:', error);
        // Close clients on error
        try {
          if (mcpClient) await mcpClient.close();
          if (standardClient) await standardClient.close();
        } catch (closeError) {
          console.error('[MCP] Error closing clients on error:', closeError);
        }
      },
    });

    console.log('[Chat API] Returning streaming response');
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[Chat API] Error:', error);

    // Ensure cleanup on error
    try {
      if (mcpClient) await mcpClient.close();
      if (standardClient) await standardClient.close();
    } catch (closeError) {
      console.error('[MCP] Error closing clients in catch:', closeError);
    }

    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
