"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Volume2, X, Bookmark } from "lucide-react"
import { speak, stopSpeaking } from "@/lib/simple-tts"
import { getWordDifficulty } from "@/lib/vocabulary-service"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { useAvatar } from "@/contexts/avatar-context"
import { Badge } from "@/components/ui/badge"

type WordDefinitionProps = {
  word: string
  onClose: () => void
}

type Definition = {
  partOfSpeech: string
  definition: string
  example?: string
  synonyms?: string[]
  difficulty?: string
}

// Simplified mock function to get word definitions
async function getWordDefinition(word: string): Promise<Definition[]> {
  // Wait a bit to simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Return mock data based on the word
  if (word.toLowerCase() === "hello") {
    return [
      {
        partOfSpeech: "exclamation",
        definition: "Used as a greeting or to begin a phone conversation.",
        example: "Hello there, how are you doing?",
        synonyms: ["hi", "greetings"],
        difficulty: "basic",
      },
      {
        partOfSpeech: "noun",
        definition: "An utterance of 'hello'; a greeting.",
        example: "She gave me a warm hello.",
        synonyms: ["greeting", "salutation"],
        difficulty: "basic",
      },
    ]
  } else if (word.toLowerCase() === "learning") {
    return [
      {
        partOfSpeech: "noun",
        definition: "The acquisition of knowledge or skills through study, experience, or being taught.",
        example: "These courses will promote active learning.",
        synonyms: ["education", "training"],
        difficulty: "intermediate",
      },
      {
        partOfSpeech: "verb",
        definition: "Present participle of learn.",
        example: "She is learning English.",
        synonyms: [],
        difficulty: "intermediate",
      },
    ]
  } else if (word.toLowerCase() === "vocabulary") {
    return [
      {
        partOfSpeech: "noun",
        definition: "The body of words used in a particular language.",
        example: "He has an extensive vocabulary.",
        synonyms: ["lexicon", "terminology"],
        difficulty: "advanced",
      },
      {
        partOfSpeech: "noun",
        definition: "A list of words with their meanings, especially in a book for learning a foreign language.",
        example: "The book has a vocabulary at the end.",
        synonyms: ["glossary", "word list"],
        difficulty: "advanced",
      },
    ]
  } else {
    // Generic response for any other word
    return [
      {
        partOfSpeech: "unknown",
        definition: `Definition for "${word}" would appear here.`,
        example: `An example sentence using "${word}" would appear here.`,
        synonyms: [],
        difficulty: "intermediate",
      },
    ]
  }
}

export function WordDefinition({ word, onClose }: WordDefinitionProps) {
  const [definitions, setDefinitions] = useState<Definition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<number>(0)
  const [saved, setSaved] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const { avatarVoice } = useAvatar()
  const { toast } = useToast()

  // Clean up speech when component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  useEffect(() => {
    const fetchDefinition = async () => {
      try {
        setLoading(true)
        const data = await getWordDefinition(word)
        setDefinitions(data)
        setError(null)

        // Determine word difficulty level
        const wordDifficulty = getWordDifficulty(word)
        setDifficulty(wordDifficulty)
      } catch (err) {
        setError("Failed to fetch definition")
        setDefinitions([])
      } finally {
        setLoading(false)
      }
    }

    fetchDefinition()
  }, [word])

  const pronounceWord = async () => {
    try {
      // If already speaking, stop first
      if (speaking) {
        stopSpeaking()
        setSpeaking(false)
        return
      }

      setSpeaking(true)
      // Use the selected avatar's voice (male or female)
      await speak(word, "en-US", avatarVoice)

      // Add a small delay before resetting the speaking state
      // This helps with visual feedback
      setTimeout(() => {
        setSpeaking(false)
      }, 500)
    } catch (error) {
      console.error("Failed to pronounce word:", error)
      setSpeaking(false)

      // Only show error for non-interruption errors
      if (error instanceof Error && !error.message.includes("interrupted")) {
        toast({
          title: "Speech Error",
          description: "Failed to pronounce the word. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1:
        return "Basic"
      case 2:
        return "Intermediate"
      case 3:
        return "Advanced"
      default:
        return "Unclassified"
    }
  }

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1:
        return "text-green-600 bg-green-50 border-green-200"
      case 2:
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case 3:
        return "text-orange-600 bg-orange-50 border-orange-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const toggleSaved = () => {
    setSaved(!saved)
  }

  const handleClose = () => {
    stopSpeaking()
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="absolute z-10 top-0 left-0 right-0"
    >
      <Card className="bg-white shadow-xl border border-indigo-100 rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex flex-col">
            <CardTitle className="text-2xl font-bold text-indigo-800">{word}</CardTitle>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full mt-1 inline-block w-fit border ${getDifficultyColor(
                difficulty,
              )}`}
            >
              {getDifficultyLabel(difficulty)}
            </span>
          </div>
          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSaved}
                className={`h-8 w-8 p-0 rounded-full ${saved ? "text-yellow-500" : "text-gray-400"}`}
              >
                <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={pronounceWord}
                className={`h-8 w-8 p-0 rounded-full ${speaking ? "bg-indigo-100" : ""} text-indigo-600 hover:bg-indigo-100`}
              >
                <Volume2 className={`h-4 w-4 ${speaking ? "animate-pulse" : ""}`} />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 rounded-full text-gray-500 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
              <p>{error}</p>
            </div>
          ) : definitions.length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
              <p>No definition found for "{word}"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {definitions.map((def, index) => {
                // Handle different response formats
                const partOfSpeech = def.partOfSpeech || "unknown"
                const mainDefinition = def.definition || "No definition available"
                const example = def.example || ""
                const synonyms = def.synonyms || []
                const difficulty = def.difficulty || "intermediate"

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-r from-indigo-50 to-white p-3 rounded-lg border border-indigo-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{word}</span>
                      <Badge variant="outline" className="text-xs">
                        {partOfSpeech}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          difficulty === "basic"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : difficulty === "advanced"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        {difficulty}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-gray-700">{mainDefinition}</p>
                      {example && <p className="text-gray-500 italic text-sm mt-1">"{example}"</p>}
                    </div>

                    {synonyms.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm font-medium">Synonyms: </span>
                        <span className="text-sm text-gray-600">{synonyms.join(", ")}</span>
                      </div>
                    )}
                  </motion.div>
                )
              })}
              <div className="pt-2">
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Portuguese:</span> {/* Translation would go here */}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
