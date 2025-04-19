"use client"
import { Lightbulb } from "lucide-react"
import { Switch } from "./ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import useToolsStore from "@/stores/useToolsStore"

export default function ReasoningToggle() {
  const { reasoningEnabled, setReasoningEnabled } = useToolsStore()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex items-center gap-2 p-2 rounded-md bg-secondary/50 cursor-pointer"
            onClick={() => setReasoningEnabled(!reasoningEnabled)}
          >
            <Lightbulb size={16} className={reasoningEnabled ? "text-amber-500" : "text-muted-foreground"} />
            <span className="text-sm">AI 추론 과정</span>
            <Switch checked={reasoningEnabled} className="ml-1" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>AI가 응답을 생성하는 과정에서의 추론 과정을 표시합니다</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
