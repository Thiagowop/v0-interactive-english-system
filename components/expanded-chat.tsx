"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Mic, Globe } from "lucide-react"
import { useChat } from "@/contexts/chat-context"
import { useAvatar } from "@/contexts/avatar-context"
import { useLanguage, useTranslation } from "@/components/language-context"
import { speak, stopSpeaking } from "@/lib/simple-tts"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"

interface ExpandedChatProps {
  isOpen: boolean
  onClose: () => void
}

export default function ExpandedChat({ isOpen, onClose }: ExpandedChatProps) {
  const { messages, setMessages } = useChat()
  const { avatarType, avatarName, avatarVoice } = useAvatar()
  const { language, speechLanguage } = useLanguage()
  const t = useTranslation()
  const [input, setInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage = {
      role: "user" as const,
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsProcessing(true)

    try {
      // Process the student's input and get a response
      // This is a simplified version - in a real app, this would call an API
      const response = getSimpleResponse(input)

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Add teacher's response
      const teacherMessage = {
        role: "assistant" as const,
        content: response,
        translation: getSimpleTranslation(response),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, teacherMessage])

      // Speak the response
      try {
        await speak(response, speechLanguage, avatarVoice)
      } catch (error) {
        console.error("Speech synthesis failed:", error)
      }
    } catch (error) {
      console.error("Message processing error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Simple response function (to be replaced with AI)
  const getSimpleResponse = (input: string): string => {
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes("hello") || lowerInput.includes("hi") || lowerInput.includes("olá")) {
      return speechLanguage === "pt-BR"
        ? `Olá! Eu sou ${avatarName}. Como você está hoje?`
        : `Hello there! I'm ${avatarName}. How are you doing today?`
    } else if (lowerInput.includes("how are you") || lowerInput.includes("como vai")) {
      return speechLanguage === "pt-BR"
        ? "Estou bem, obrigado por perguntar! E você?"
        : "I'm doing well, thank you for asking! How about you?"
    } else if (lowerInput.includes("name") || lowerInput.includes("nome")) {
      return speechLanguage === "pt-BR"
        ? `Eu sou ${avatarName}, seu assistente de professor de inglês!`
        : `I'm ${avatarName}, your English teacher assistant!`
    } else {
      return speechLanguage === "pt-BR"
        ? "Interessante! Poderia me contar mais sobre o que você gostaria de aprender em inglês?"
        : "That's interesting! Could you tell me more about what you'd like to learn in English?"
    }
  }

  // Simple translation function (to be replaced with AI)
  const getSimpleTranslation = (text: string): string => {
    // If the text is already in Portuguese, no need to translate
    if (speechLanguage === "pt-BR") {
      return "English translation not available"
    }

    const translations: Record<string, string> = {
      [`Hello there! I'm ${avatarName}. How are you doing today?`]: `Olá! Eu sou ${avatarName}. Como você está hoje?`,
      "I'm doing well, thank you for asking! How about you?": "Estou bem, obrigado por perguntar! E você?",
      [`I'm ${avatarName}, your English teacher assistant!`]: `Sou ${avatarName}, seu assistente de professor de inglês!`,
      "That's interesting! Could you tell me more about what you'd like to learn in English?":
        "Interessante! Poderia me contar mais sobre o que você gostaria de aprender em inglês?",
    }

    return translations[text] || "Tradução não disponível"
  }

  const toggleRecording = () => {
    if (!isRecording) {
      // Start speech recognition
      if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()

        // Set recognition language based on current language setting
        recognition.lang = speechLanguage === "pt-BR" ? "pt-BR" : "en-US"
        recognition.continuous = false
        recognition.interimResults = false

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          setInput(transcript)
          setIsRecording(false)
        }

        recognition.onerror = () => {
          setIsRecording(false)
        }

        recognition.start()
        setIsRecording(true)
      }
    } else {
      // Stop recording
      setIsRecording(false)
    }
  }

  const getAvatarImage = () => {
    return avatarType === "female" ? "/cheerful-teacher-avatar.png" : "/male-teacher-avatar.png"
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden"
        >
          <Card className="border-0 shadow-none h-[80vh] flex flex-col">
            <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0 sticky top-0 z-10 bg-white">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{t("app.title")}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Globe className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={onClose}
                  aria-label="Minimize chat"
                  title="Minimize chat"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
                    <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
                    <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
                  </svg>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col">
              <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="h-8 w-auto self-start mx-4 mt-2 sticky top-12 z-10 bg-white">
                  <TabsTrigger value="chat" className="text-xs px-3">
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="practice" className="text-xs px-3">
                    Practice
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0 data-[state=inactive]:hidden">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4 min-h-[300px]">
                      {messages.map((message, index) => (
                        <div key={index} className="flex items-start gap-3">
                          {message.role === "assistant" && (
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1">
                              <Image
                                src={getAvatarImage() || "/placeholder.svg"}
                                alt={avatarName}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div
                            className={`rounded-lg p-3 max-w-[85%] ${
                              message.role === "user"
                                ? "bg-indigo-100 text-indigo-900 ml-auto"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <p className="mb-1">{message.content}</p>
                            {message.translation && (
                              <p className="text-gray-500 text-sm italic">{message.translation}</p>
                            )}
                            <div className="text-right text-xs text-gray-400 mt-1">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="p-4 border-t sticky bottom-0 z-10 bg-white">
                    <div className="relative">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        placeholder={t("chat.placeholder")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-24"
                        disabled={isProcessing}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
                          onClick={toggleRecording}
                          disabled={isProcessing}
                        >
                          <Mic className={`h-5 w-5 ${isRecording ? "text-red-500 animate-pulse" : ""}`} />
                        </Button>
                        <Button
                          variant="default"
                          size="icon"
                          className="h-9 w-9 rounded-full bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                          onClick={handleSendMessage}
                          disabled={!input.trim() || isProcessing}
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="practice" className="flex-1 p-4 m-0 data-[state=inactive]:hidden">
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-indigo-700 mb-2">Practice Mode</h3>
                      <p className="text-gray-600 mb-4">
                        Practice your speaking skills with guided exercises and real-time feedback.
                      </p>
                      <Button className="bg-indigo-600 hover:bg-indigo-700">Start Practice Session</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
