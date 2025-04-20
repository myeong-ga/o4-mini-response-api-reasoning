"use client"

import type React from "react"

import type { MessageItem } from "@/lib/assistant"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { cn } from "@/lib/utils"
import { Check, Copy } from "lucide-react"
import useSyntaxThemeStore from "@/stores/useSyntaxThemeStore"

// Import all the themes
import {
  vscDarkPlus,
  vs,
  dracula,
  atomDark,
  solarizedlight,
  okaidia,
} from "react-syntax-highlighter/dist/esm/styles/prism"

interface MessageProps {
  message: MessageItem
}

// Map of theme IDs to actual theme objects
const themeMap: Record<string, any> = {
  vscDarkPlus,
  vs,
  dracula,
  atomDark,
  solarizedlight,
  okaidia,
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === "user"
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const { selectedThemeId } = useSyntaxThemeStore()

  // Get the selected theme or fall back to vscDarkPlus
  const selectedTheme = themeMap[selectedThemeId] || vscDarkPlus

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code)
      setTimeout(() => {
        setCopiedCode(null)
      }, 2000)
    })
  }

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn("max-w-[85%] rounded-lg px-4 py-2", isUser ? "bg-primary text-primary-foreground" : "bg-muted")}
      >
        <ReactMarkdown
          className="prose dark:prose-invert prose-sm max-w-none"
          components={{
            code(props) {
              const { children, className, ...rest } = props
              const match = /language-(\w+)/.exec(className || "")
              const language = match ? match[1] : ""
              const codeString = String(children).replace(/\n$/, "")

              // Check if this is a code block (has language class) or inline code
              const isCodeBlock = match && className?.includes(`language-${language}`)

              if (isCodeBlock) {
                return (
                  <div className="relative rounded-md overflow-hidden">
                    <div className="absolute right-2 top-2 z-10">
                      <button
                        onClick={() => copyToClipboard(codeString)}
                        className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                        aria-label="Copy code to clipboard"
                      >
                        {copiedCode === codeString ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                    <div className="pt-8">
                      <SyntaxHighlighter language={language} style={selectedTheme}>
                        {codeString}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                )
              }

              return (
                <code className={className} {...rest}>
                  {children}
                </code>
              )
            },
          }}
        >
          {message.content[0].text as string}
        </ReactMarkdown>
      </div>
    </div>
  )
}

export default Message
