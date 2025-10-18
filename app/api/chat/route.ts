import {
  aiServices,
  CustomUIMessage,
  formatRoutingInfo,
} from '@/lib/services/ai-services';

export async function POST(req: Request) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    console.log(`[${requestId}] ===== NEW REQUEST =====`);
    const body = await req.json();
    const { messages } = body;

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      console.error(`[${requestId}] Invalid messages format:`, messages);
      return new Response(
        JSON.stringify({ error: 'Messages must be a non-empty array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    console.log(`[${requestId}] Step 1: Received ${messages.length} messages`);
    console.log(
      `[${requestId}] Last message:`,
      messages[messages.length - 1]?.content?.substring(0, 100) + '...',
    );

    // Initialize services
    console.log(`[${requestId}] Step 2: Initializing AI services...`);
    await aiServices.initialize();
    console.log(`[${requestId}] ✓ AI services initialized`);

    // Process request and get routing info
    console.log(`[${requestId}] Step 3: Processing request and routing...`);
    const { routing, stream } = await aiServices.processRequest(
      messages as CustomUIMessage[],
    );

    console.log(`[${requestId}] ✓ Routing complete:`, {
      agent: routing.agent,
      confidence: routing.confidence,
      chainId: routing.chainId,
      reasoning: routing.reasoning,
    });

    // Convert to streaming response
    console.log(`[${requestId}] Step 4: Starting agent stream...`);
    const response = stream.toUIMessageStreamResponse({
      originalMessages: messages,
      messageMetadata: () => ({
        agentType: routing.agent,
        chainId: routing.chainId,
        timestamp: new Date().toISOString(),
      }),
      // onStepFinish: async (step) => {
      //   console.log(`[${requestId}] Agent step finished:`, {
      //     agent: routing.agent,
      //     toolCalls: step.toolCalls?.length || 0,
      //   });
      // },
      onFinish: async ({ responseMessage }) => {
        console.log(`[${requestId}] ===== REQUEST COMPLETE =====`);
        console.log(`[${requestId}] Final stats:`, {
          agent: routing.agent,
          confidence: routing.confidence,
          messageId: responseMessage.id,
        });
      },
    });

    console.log(`[${requestId}] ✓ Returning streaming response`);
    return response;
  } catch (error) {
    console.error(`[${requestId}] ===== ERROR =====`);
    console.error(`[${requestId}] Error type:`, error?.constructor?.name);
    console.error(
      `[${requestId}] Error message:`,
      error instanceof Error ? error.message : String(error),
    );
    console.error(`[${requestId}] Full error:`, error);

    // Try to cleanup
    try {
      await aiServices.cleanup();
      console.log(`[${requestId}] ✓ Cleanup completed`);
    } catch (cleanupError) {
      console.error(`[${requestId}] Cleanup failed:`, cleanupError);
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
