import type { MessageItem } from "@/lib/assistant"
import type React from "react"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

interface MessageProps {
  message: MessageItem
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn("max-w-[85%] rounded-lg px-4 py-2", isUser ? "bg-primary text-primary-foreground" : "bg-muted")}
      >
        <ReactMarkdown className="prose dark:prose-invert prose-sm max-w-none">
          {message.content[0].text as string}
        </ReactMarkdown>
      </div>
    </div>
  )
}

export default Message
