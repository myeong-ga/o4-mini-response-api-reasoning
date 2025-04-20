"use client"

import { Check, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import useSyntaxThemeStore, { themeOptions } from "@/stores/useSyntaxThemeStore"

export function SyntaxThemeSelector() {
  const { selectedThemeId, setSelectedThemeId } = useSyntaxThemeStore()

  // Get the current theme option
  const currentTheme = themeOptions.find((t) => t.id === selectedThemeId) || themeOptions[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Code size={14} />
          <span className="hidden sm:inline">Code Theme:</span>
          <span className="font-medium">{currentTheme.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themeOptions.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.id}
            onClick={() => setSelectedThemeId(themeOption.id)}
            className="flex items-center justify-between"
          >
            {themeOption.name}
            {selectedThemeId === themeOption.id && <Check size={16} className="ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
