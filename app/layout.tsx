import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "@/components/language-context"
import LanguageSwitcher from "@/components/language-switcher"
import Link from "next/link"
import { EnvironmentProvider } from "@/contexts/environment-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Interactive English Teacher",
  description: "Learn English with an interactive AI-powered teacher",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <EnvironmentProvider>
            <Link href="/gemini-test" className="text-blue-600 hover:underline">
              Teste Gemini
            </Link>
            {children}
            <LanguageSwitcher variant="global" />
          </EnvironmentProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
