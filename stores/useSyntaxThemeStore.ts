import { create } from "zustand"
import { persist } from "zustand/middleware"

// Theme options
export type ThemeOption = {
  id: string
  name: string
  isDark: boolean
}

export const themeOptions: ThemeOption[] = [
  { id: "vscDarkPlus", name: "VS Code Dark+", isDark: true },
  { id: "vs", name: "VS Code Light", isDark: false },
  { id: "dracula", name: "Dracula", isDark: true },
  { id: "atomDark", name: "Atom Dark", isDark: true },
  { id: "github", name: "GitHub", isDark: false },
  { id: "monokai", name: "Monokai", isDark: true },
  { id: "solarizedlight", name: "Solarized Light", isDark: false },
  { id: "okaidia", name: "Okaidia", isDark: true },
]

interface SyntaxThemeState {
  selectedThemeId: string
  setSelectedThemeId: (themeId: string) => void
}

const useSyntaxThemeStore = create<SyntaxThemeState>()(
  persist(
    (set) => ({
      selectedThemeId: "vscDarkPlus", // Default theme
      setSelectedThemeId: (themeId) => set({ selectedThemeId: themeId }),
    }),
    {
      name: "syntax-theme-store",
    },
  ),
)

export default useSyntaxThemeStore
