"use client"
import Chat from "./chat"
import useConversationStore from "@/stores/useConversationStore"
import { type Item, processMessages } from "@/lib/assistant"
import { useState, useEffect } from "react"
import useToolsStore from "@/stores/useToolsStore"

export default function Assistant() {
  const {
    chatMessages,
    addConversationItem,
    setChatMessages,
  } = useConversationStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { reasoningEnabled } = useToolsStore()

  // Re-render when reasoning setting changes
  useEffect(() => {
    // This empty effect will cause a re-render when reasoningEnabled changes
  }, [reasoningEnabled])


  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    setIsSubmitting(true)

    try {
      // Optimistic UI
      const userItem: Item = {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: message.trim() }],
      }

      // messages back and forth to server
      const userMessage: any = {
        role: "user",
        content: message.trim(),
      }

      // 사용자 메시지를 상태에 추가
      addConversationItem(userMessage);

      // 사용자 메시지를 채팅 메시지UI에 추가 , Optimistic UI 
      const updatedChatMessages = [...chatMessages, userItem];
      setChatMessages(updatedChatMessages);

      // API 호출 및 응답 처리
      await processMessages()
    } catch (error) {
      console.error("Error processing message:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full">
      <Chat items={chatMessages} onSendMessage={handleSendMessage} isSubmitting={isSubmitting} />
    </div>
  )
}
