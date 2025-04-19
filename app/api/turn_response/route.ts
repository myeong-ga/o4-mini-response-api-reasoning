import { MODEL } from "@/config/constants"
import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: Request) {
  try {
    const { messages, tools, reasoningEnabled } = await request.json()
   
    console.log("Received messages:", messages)

    const openai = new OpenAI()

    // Base options for the API call
    const options: any = {
      model: MODEL,
      input: messages,
      tools,
      stream: true,
      parallel_tool_calls: false,
      max_output_tokens: 23000,
    }

    // Add reasoning parameter if enabled
    if (reasoningEnabled) {
      options.reasoning = { effort: "medium", summary: "auto" }
    }
    
    const events = await openai.responses.create(options)

    // Create a ReadableStream that emits SSE data as Uint8Array chunks
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const event of events as unknown as AsyncIterable<OpenAI.Responses.ResponseStreamEvent>) {
            const data = JSON.stringify({ event: event.type, data: event })
            // enqueue as Uint8Array so TextDecoder.decode() will work
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }
          controller.close()
        } catch (error) {
          console.error("Error in streaming loop:", error)
          controller.error(error)
        }
      },
    })

    // Create two branches of the stream: one for the client, one for logging
    const [clientStream, ] = stream.tee()



    // Return the client branch as the SSE response
    return new Response(clientStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error in POST handler:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
