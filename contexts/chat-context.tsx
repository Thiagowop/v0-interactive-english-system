"use client"

import type React from "react"

import { createContext, useContext, useState, type ReactNode } from "react"

// Types for our messages
export type Message = {
  role: "user" | "assistant"
  content: string
  translation?: string
  timestamp: Date
}

type ChatContextType = {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  extractedVocabulary: { word: string; difficulty: number }[]
  updateExtractedVocabulary: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your English teacher. How can I help you today?",
      translation: "Olá! Eu sou seu professor de inglês. Como posso ajudá-lo hoje?",
      timestamp: new Date(),
    },
  ])

  const [extractedVocabulary, setExtractedVocabulary] = useState<{ word: string; difficulty: number }[]>([
    { word: "Hello", difficulty: 1 },
    { word: "English", difficulty: 1 },
    { word: "Teacher", difficulty: 1 },
    { word: "Help", difficulty: 1 },
    { word: "Today", difficulty: 1 },
  ])

  // Fix the updateExtractedVocabulary function to properly extract words from messages
  const updateExtractedVocabulary = () => {
    // Extract all words from all messages
    const allWords = messages
      .flatMap((msg) => msg.content.split(/\s+/))
      .map((word) => word.toLowerCase().replace(/[.,!?;:'"()]/g, ""))
      .filter((word) => word.length > 2) // Filter out very short words

    // Remove duplicates and get unique words
    const uniqueWords = [...new Set(allWords)]

    // Import the vocabulary service to get word difficulty
    import("@/lib/vocabulary-service").then(({ getWordDifficulty }) => {
      // Get difficulty for each word and filter out unknown words
      const wordsWithDifficulty = uniqueWords
        .map((word) => ({
          word: word.charAt(0).toUpperCase() + word.slice(1), // Capitalize first letter
          difficulty: getWordDifficulty(word),
        }))
        .filter((item) => item.difficulty > 0) // Filter out unknown words
        .sort((a, b) => b.difficulty - a.difficulty) // Sort by difficulty (hardest first)

      // Take the top 15 words (or fewer if there aren't that many)
      const topWords = wordsWithDifficulty.slice(0, 15)
      setExtractedVocabulary(topWords)
    })
  }

  return (
    <ChatContext.Provider value={{ messages, setMessages, extractedVocabulary, updateExtractedVocabulary }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
