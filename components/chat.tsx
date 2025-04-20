"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import ToolCall from "./tool-call"
import Message from "./message"
import Reasoning from "./reasoning"
import Annotations from "./annotations"
import { Loader2, Send } from "lucide-react"
import type { Item, ReasoningItem } from "@/lib/assistant"
import useToolsStore from "@/stores/useToolsStore"

interface ChatProps {
  items: Item[]
  onSendMessage: (message: string) => void
  isSubmitting: boolean
}

const Chat: React.FC<ChatProps> = ({ items, onSendMessage, isSubmitting }) => {
  const itemsEndRef = useRef<HTMLDivElement>(null)
  const [inputMessageText, setInputMessageText] = useState<string>("")
  // This state is used to provide better user experience for non-English IMEs such as Japanese
  const [isComposing, setIsComposing] = useState(false)

  const { reasoningEnabled } = useToolsStore()

  const scrollToBottom = () => {
    itemsEndRef.current?.scrollIntoView({ behavior: "instant" })
  }

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !isComposing && !isSubmitting) {
        event.preventDefault()
        onSendMessage(inputMessageText)
        setInputMessageText("")
      }
    },
    [onSendMessage, inputMessageText, isComposing, isSubmitting],
  )

  useEffect(() => {
    scrollToBottom()
  }, [items])

  // Check if there are any messages
  const hasMessages = items.some((item) => item.type === "message")

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <h2 className="text-2xl font-semibold mb-2">OpenAI o3 and o4-mini Thinking</h2>
            <p className="text-muted-foreground mb-8">Built-in Web search with Response API</p>
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((item, index) => (
              <React.Fragment key={index}>
                {item.type === "tool_call" ? (
                  <ToolCall toolCall={item} />
                ) : item.type === "message" ? (
                  <div className="flex flex-col gap-1">
                    <Message message={item} />
                    {item.content && item.content[0].annotations && item.content[0].annotations.length > 0 && (
                      <Annotations annotations={item.content[0].annotations} />
                    )}
                  </div>
                ) : item.type === "reasoning" && reasoningEnabled ? (
                  <Reasoning reasoning={item as ReasoningItem} />
                ) : null}
              </React.Fragment>
            ))}
            <div ref={itemsEndRef} />
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <div className="relative">
          <textarea
            id="prompt-textarea"
            tabIndex={0}
            rows={1}
            placeholder="Ask a question..."
            className="w-full resize-none bg-background border rounded-md py-3 pl-4 pr-24 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
            value={inputMessageText}
            onChange={(e) => setInputMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            style={{ minHeight: "56px", maxHeight: "200px" }}
            disabled={isSubmitting}
          />
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <button
              disabled={!inputMessageText.trim() || isSubmitting}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-40"
              onClick={() => {
                if (inputMessageText.trim() && !isSubmitting) {
                  onSendMessage(inputMessageText)
                  setInputMessageText("")
                }
              }}
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground text-center mt-2">
          Press <kbd className="px-1 py-0.5 bg-muted rounded-sm">Ctrl</kbd> +{" "}
          <kbd className="px-1 py-0.5 bg-muted rounded-sm">Enter</kbd> to send
        </div>
      </div>
    </div>
  )
}

export default Chat
