import { DEVELOPER_PROMPT } from "@/config/constants"
import { parse } from "partial-json"
import { handleTool } from "@/lib/tools/tools-handling"
import useConversationStore from "@/stores/useConversationStore"
import { getTools } from "./tools/tools"
import type { Annotation } from "@/components/annotations"
import type { functionsMap } from "@/config/functions"
import useToolsStore from "@/stores/useToolsStore"

export interface ContentItem {
  type: "input_text" | "output_text" | "refusal" | "output_audio"
  annotations?: Annotation[]
  text?: string
}

// Message items for storing conversation history matching API shape
export interface MessageItem {
  type: "message"
  role: "user" | "assistant" | "system"
  id?: string
  content: ContentItem[]
}

// Custom items to display in chat
export interface ToolCallItem {
  type: "tool_call"
  tool_type: "file_search_call" | "web_search_call" | "function_call"
  status: "in_progress" | "completed" | "failed" | "searching"
  id: string
  name?: string | null
  call_id?: string
  arguments?: string
  parsedArguments?: any
  output?: string | null
}

// New interface for reasoning summary parts
export interface SummaryTextPart {
  type: "summary_text"
  text: string
}

// New interface for reasoning items
export interface ReasoningItem {
  type: "reasoning"
  id: string
  summary: SummaryTextPart[]
  isExpanded?: boolean
}

export type Item = MessageItem | ToolCallItem | ReasoningItem

export const handleTurn = async (
  messages: any[],
  tools: any[],
  reasoningEnabled: boolean,
  onMessage: (data: any) => void,
) => {
  try {
    // Clean up messages to ensure they're in the format expected by the API
    const cleanedMessages = messages
      .map((msg) => {
        // Create a new object with only the properties needed by the API
        const cleanMsg: any = {
          role: msg.role,
        }

        // Handle content based on its type
        if (typeof msg.content === "string") {
          cleanMsg.content = msg.content
        } else if (Array.isArray(msg.content)) {
          // Ensure content array items have required properties
            cleanMsg.content = msg.content.filter((item: ContentItem) => 
            item && (item.text !== undefined || item.type !== undefined)
            )
        }

        return cleanMsg
      })
      .filter(
        (msg) =>
          // Filter out any messages that don't have valid content
          msg.role && (typeof msg.content === "string" || (Array.isArray(msg.content) && msg.content.length > 0)),
      )

    // Get response from the API (defined in app/api/turn_response/route.ts)
    const response = await fetch("/api/turn_response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: cleanedMessages,
        tools: tools,
        reasoningEnabled: reasoningEnabled,
      }),
    })

    if (!response.ok) {
      console.error(`Error: ${response.status} - ${response.statusText}`)
      return
    }

    // Reader for streaming data
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let done = false
    let buffer = ""

    while (!done) {
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      const chunkValue = decoder.decode(value)
      buffer += chunkValue

      const lines = buffer.split("\n\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6)
          if (dataStr === "[DONE]") {
            done = true
            break
          }
          const data = JSON.parse(dataStr)
          onMessage(data)
        }
      }
    }

    // Handle any remaining data in buffer
    if (buffer && buffer.startsWith("data: ")) {
      const dataStr = buffer.slice(6)
      if (dataStr !== "[DONE]") {
        const data = JSON.parse(dataStr)
        onMessage(data)
      }
    }
  } catch (error) {
    console.error("Error handling turn:", error)
  }
}

export const processMessages = async () => {
  const { chatMessages, conversationItems, setChatMessages, setConversationItems } = useConversationStore.getState()
  const { reasoningEnabled } = useToolsStore.getState()

  const tools = getTools()
  console.log("tools", tools)

  // Filter out reasoning items and any invalid message formats before sending to API
  const validConversationItems = conversationItems.filter((item) => {
    // Filter out reasoning items
    if (item.type === "reasoning") {
      return false
    }

    // Filter out any other invalid message formats
    // Only keep items with valid role and content
    return item.role && (typeof item.content === "string" || (Array.isArray(item.content) && item.content.length > 0))
  })

  const allConversationItems = [
    // Adding developer prompt as first item in the conversation
    {
      role: "developer",
      content: DEVELOPER_PROMPT,
    },
    ...validConversationItems,
  ]

  // 변경: const reasoningSummaryContent를 let으로 변경
  let assistantMessageContent = ""
  let functionArguments = ""
  const reasoningSummaryContent: { [key: string]: { [key: number]: string } } = {}

  await handleTurn(allConversationItems, tools, reasoningEnabled, async ({ event, data }) => {
    switch (event) {
      case "response.output_text.delta":
      case "response.output_text.annotation.added": {
        const { delta, item_id, annotation } = data

        //console.log("event", data)

        let partial = ""
        if (typeof delta === "string") {
          partial = delta
        }
        assistantMessageContent += partial

        // If the last message isn't an assistant message, create a new one
        const lastItem = chatMessages[chatMessages.length - 1]
        if (
          !lastItem ||
          lastItem.type !== "message" ||
          lastItem.role !== "assistant" ||
          (lastItem.id && lastItem.id !== item_id)
        ) {
          chatMessages.push({
            type: "message",
            role: "assistant",
            id: item_id,
            content: [
              {
                type: "output_text",
                text: assistantMessageContent,
              },
            ],
          } as MessageItem)
        } else {
          const contentItem = lastItem.content[0]
          if (contentItem && contentItem.type === "output_text") {
            contentItem.text = assistantMessageContent
            if (annotation) {
              contentItem.annotations = [...(contentItem.annotations ?? []), annotation]
            }
          }
        }

        // 상태 업데이트
        setChatMessages([...chatMessages])
        break
      }

      // Handle reasoning summary text deltas
      case "response.reasoning_summary_text.delta": {
        const { item_id, summary_index, delta } = data

        // Initialize if needed
        if (!reasoningSummaryContent[item_id]) {
          reasoningSummaryContent[item_id] = {}
        }

        // Initialize summary index if needed
        if (!reasoningSummaryContent[item_id][summary_index]) {
          reasoningSummaryContent[item_id][summary_index] = ""
        }

        // Append delta to the summary content
        reasoningSummaryContent[item_id][summary_index] += delta || ""

        // Find or create reasoning item
        const reasoningItem = chatMessages.find(
          (item): item is ReasoningItem => item.type === "reasoning" && item.id === item_id,
        )

        if (reasoningItem) {
          // Update existing reasoning item
          if (!reasoningItem.summary[summary_index]) {
            reasoningItem.summary[summary_index] = { type: "summary_text", text: "" }
          }
          reasoningItem.summary[summary_index].text = reasoningSummaryContent[item_id][summary_index]
        } else {
          // Create new reasoning item
          const newSummary: SummaryTextPart[] = []
          newSummary[summary_index] = {
            type: "summary_text",
            text: reasoningSummaryContent[item_id][summary_index],
          }

          chatMessages.push({
            type: "reasoning",
            id: item_id,
            summary: newSummary,
            isExpanded: false,
          } as ReasoningItem)
        }

        setChatMessages([...chatMessages])
        break
      }

      // Handle complete reasoning summary text
      case "response.reasoning_summary_text.done": {
        const { item_id, summary_index, text } = data

        const reasoningItem = chatMessages.find(
          (item): item is ReasoningItem => item.type === "reasoning" && item.id === item_id,
        )

        if (reasoningItem) {
          if (!reasoningItem.summary[summary_index]) {
            reasoningItem.summary[summary_index] = { type: "summary_text", text: "" }
          }
          reasoningItem.summary[summary_index].text = text
          setChatMessages([...chatMessages])
        }
        break
      }

      case "response.output_item.added": {
        const { item } = data || {}
        // New item coming in
        if (!item || !item.type) {
          break
        }
        // Handle differently depending on the item type
        switch (item.type) {
          case "message": {
            const text = item.content?.text || ""
            chatMessages.push({
              type: "message",
              role: "assistant",
              content: [
                {
                  type: "output_text",
                  text,
                },
              ],
            })
            conversationItems.push({
              role: "assistant",
              content: [
                {
                  type: "output_text",
                  text,
                },
              ],
            })
            setChatMessages([...chatMessages])
            setConversationItems([...conversationItems])
            break
          }
          case "function_call": {
            functionArguments += item.arguments || ""
            chatMessages.push({
              type: "tool_call",
              tool_type: "function_call",
              status: "in_progress",
              id: item.id,
              name: item.name, // function name,e.g. "get_weather"
              arguments: item.arguments || "",
              parsedArguments: {},
              output: null,
            })
            setChatMessages([...chatMessages])
            break
          }
          case "web_search_call": {
            chatMessages.push({
              type: "tool_call",
              tool_type: "web_search_call",
              status: item.status || "in_progress",
              id: item.id,
            })
            setChatMessages([...chatMessages])
            break
          }
          case "file_search_call": {
            chatMessages.push({
              type: "tool_call",
              tool_type: "file_search_call",
              status: item.status || "in_progress",
              id: item.id,
            })
            setChatMessages([...chatMessages])
            break
          }
          case "reasoning": {
            // Handle reasoning item
            chatMessages.push({
              type: "reasoning",
              id: item.id,
              summary: item.summary || [],
              isExpanded: false,
            })
            setChatMessages([...chatMessages])
            break
          }
        }
        break
      }

      case "response.output_item.done": {
        // After output item is done, adding tool call ID
        const { item } = data || {}

        if (item.type === "reasoning") {
          // Update the reasoning item with complete data
          const reasoningItem = chatMessages.find((m): m is ReasoningItem => m.type === "reasoning" && m.id === item.id)
          if (reasoningItem) {
            reasoningItem.summary = item.summary || []
            setChatMessages([...chatMessages])
          }
          // Don't add reasoning items to conversationItems
        } else {
          const toolCallMessage = chatMessages.find((m) => m.id === item.id)
          if (toolCallMessage && toolCallMessage.type === "tool_call") {
            toolCallMessage.call_id = item.call_id
            setChatMessages([...chatMessages])
          }
          // Only add non-reasoning items to conversationItems
          conversationItems.push(item)
          setConversationItems([...conversationItems])
        }
        break
      }

      case "response.function_call_arguments.delta": {
        // Streaming arguments delta to show in the chat
        functionArguments += data.delta || ""
        let parsedFunctionArguments = {}
        if (functionArguments.length > 0) {
          parsedFunctionArguments = parse(functionArguments)
        }

        const toolCallMessage = chatMessages.find((m) => m.id === data.item_id)
        if (toolCallMessage && toolCallMessage.type === "tool_call") {
          toolCallMessage.arguments = functionArguments
          try {
            toolCallMessage.parsedArguments = parsedFunctionArguments
          } catch {
            // partial JSON can fail parse; ignore
          }
          setChatMessages([...chatMessages])
        }
        break
      }

      case "response.function_call_arguments.done": {
        // This has the full final arguments string
        const { item_id, arguments: finalArgs } = data

        functionArguments = finalArgs

        // Mark the tool_call as "completed" and parse the final JSON
        const toolCallMessage = chatMessages.find((m) => m.id === item_id)
        if (toolCallMessage && toolCallMessage.type === "tool_call") {
          toolCallMessage.arguments = finalArgs
          toolCallMessage.parsedArguments = parse(finalArgs)
          toolCallMessage.status = "completed"
          setChatMessages([...chatMessages])

          // Handle tool call (execute function)
          const toolResult = await handleTool(
            toolCallMessage.name as keyof typeof functionsMap,
            toolCallMessage.parsedArguments,
          )

          // Record tool output
          toolCallMessage.output = JSON.stringify(toolResult)
          setChatMessages([...chatMessages])
          conversationItems.push({
            type: "function_call_output",
            call_id: toolCallMessage.call_id,
            status: "completed",
            output: JSON.stringify(toolResult),
          })
          setConversationItems([...conversationItems])

          // Create another turn after tool output has been added
          await processMessages()
        }
        break
      }

      case "response.web_search_call.completed": {
        const { item_id, output } = data
        const toolCallMessage = chatMessages.find((m) => m.id === item_id)
        if (toolCallMessage && toolCallMessage.type === "tool_call") {
          toolCallMessage.output = output
          toolCallMessage.status = "completed"
          setChatMessages([...chatMessages])
        }
        break
      }

      case "response.file_search_call.completed": {
        const { item_id, output } = data
        const toolCallMessage = chatMessages.find((m) => m.id === item_id)
        if (toolCallMessage && toolCallMessage.type === "tool_call") {
          toolCallMessage.output = output
          toolCallMessage.status = "completed"
          setChatMessages([...chatMessages])
        }
        break
      }

      // Handle other events as needed
    }
  })
}
