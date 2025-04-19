"use client"
import { useState, useEffect } from "react"
import type { ReasoningItem } from "@/lib/assistant"
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react"
import ReactMarkdown from "react-markdown"
import useToolsStore from "@/stores/useToolsStore"

interface ReasoningProps {
  reasoning: ReasoningItem
}

export default function Reasoning({ reasoning }: ReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { reasoningEnabled } = useToolsStore()

  // Reset expanded state when reasoning is toggled off and on
  useEffect(() => {
    if (!reasoningEnabled) {
      setIsExpanded(false)
    }
  }, [reasoningEnabled])

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  // Don't render if reasoning is disabled
  if (!reasoningEnabled) return null

  return (
    <div className="flex flex-col w-full max-w-[85%] relative mb-2">
      <div
        className="flex items-center gap-2 text-amber-500 mb-1 cursor-pointer hover:text-amber-600 transition-colors"
        onClick={toggleExpand}
      >
        <Lightbulb size={16} />
        <div className="text-sm font-medium flex items-center gap-1">
          AI의 추론 과정
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {isExpanded && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm">
          {reasoning.summary.map((part, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <ReactMarkdown className="prose dark:prose-invert prose-sm max-w-none">{part.text}</ReactMarkdown>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
