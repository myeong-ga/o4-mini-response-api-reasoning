import { create } from "zustand"
import { persist } from "zustand/middleware"


export type WebSearchConfig = {
  user_location?: {
    type: "approximate"
    country?: string
    city?: string
    region?: string
  }
}

interface StoreState {

  webSearchEnabled: boolean
  setWebSearchEnabled: (enabled: boolean) => void
  functionsEnabled: boolean
  //previousFunctionsEnabled: boolean;
  setFunctionsEnabled: (enabled: boolean) => void
  reasoningEnabled: boolean
  setReasoningEnabled: (enabled: boolean) => void

  webSearchConfig: WebSearchConfig
  setWebSearchConfig: (config: WebSearchConfig) => void
}

const useToolsStore = create<StoreState>()(
  persist(
    (set) => ({
     
      webSearchConfig: {
        user_location: {
          type: "approximate",
          country: "",
          city: "",
          region: "",
        },
      },
    
      webSearchEnabled: false,
      setWebSearchEnabled: (enabled) => {
        set({ webSearchEnabled: enabled })
      },
      functionsEnabled: false,
      previousFunctionsEnabled: false,
      setFunctionsEnabled: (enabled) => {
        set({ functionsEnabled: enabled })
      },
      reasoningEnabled: true,
      setReasoningEnabled: (enabled) => {
        set({ reasoningEnabled: enabled })
      },
 
      setWebSearchConfig: (config) => set({ webSearchConfig: config }),
    }),
    {
      name: "tools-store",
    },
  ),
)

export default useToolsStore
