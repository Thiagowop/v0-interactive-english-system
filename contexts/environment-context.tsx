"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type ConversationEnvironment = {
  id: string
  name: string
  description: string
  systemPrompt: string
  icon: string
}

export const CONVERSATION_ENVIRONMENTS: ConversationEnvironment[] = [
  {
    id: "casual",
    name: "Casual Conversation",
    description: "Everyday informal conversations with friends",
    systemPrompt:
      "You are a friendly English teacher. Use casual, everyday language with some common slang. Keep responses brief and conversational, as if chatting with a friend.",
    icon: "coffee",
  },
  {
    id: "business",
    name: "Business English",
    description: "Professional workplace conversations",
    systemPrompt:
      "You are a business English coach. Use professional vocabulary and formal expressions. Focus on workplace communication, meetings, and business etiquette. Keep responses concise and professional.",
    icon: "briefcase",
  },
  {
    id: "academic",
    name: "Academic English",
    description: "Formal academic discussions",
    systemPrompt:
      "You are an academic English instructor. Use formal academic language and vocabulary. Focus on precise expression and logical structure. Keep responses brief but academically appropriate.",
    icon: "graduation-cap",
  },
  {
    id: "travel",
    name: "Travel Situations",
    description: "Conversations for travelers",
    systemPrompt:
      "You are a travel English guide. Focus on practical travel situations like hotels, transportation, and restaurants. Use helpful travel-related vocabulary and phrases. Keep responses short and practical.",
    icon: "plane",
  },
  {
    id: "slang",
    name: "Slang & Idioms",
    description: "Modern slang and idiomatic expressions",
    systemPrompt:
      "You are a cool English teacher who specializes in modern slang and idioms. Use current expressions and explain their meanings briefly. Keep your tone relaxed and fun while being educational.",
    icon: "message-circle",
  },
]

type EnvironmentContextType = {
  environment: ConversationEnvironment
  setEnvironment: (env: ConversationEnvironment) => void
  environments: ConversationEnvironment[]
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined)

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [environment, setEnvironment] = useState<ConversationEnvironment>(CONVERSATION_ENVIRONMENTS[0])

  return (
    <EnvironmentContext.Provider
      value={{
        environment,
        setEnvironment,
        environments: CONVERSATION_ENVIRONMENTS,
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  )
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext)
  if (context === undefined) {
    throw new Error("useEnvironment must be used within an EnvironmentProvider")
  }
  return context
}
