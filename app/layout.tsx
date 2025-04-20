import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"

export const metadata: Metadata = {
  title: "Vercel AI Assistant",
  description: "AI 어시스턴트와 대화하세요",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={GeistMono.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <div className="flex flex-col min-h-screen bg-background">
            <header className="sticky top-0 z-50 flex items-center justify-between w-full h-14 px-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <h1 className="text-lg font-semibold">o4-mini Reasoning summary 데모</h1>
              <ModeToggle />
            </header>
            <main className="flex flex-col flex-1 items-center w-full">
              <div className="w-full max-w-3xl mx-auto">{children}</div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
