"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Volume2, VolumeX, RefreshCw, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAvatar } from "@/contexts/avatar-context"
import { speak, stopSpeaking } from "@/lib/simple-tts"
import RealTimeSpeechRecognition from "./real-time-speech-recognition"
import { useChat } from "@/contexts/chat-context"
import { useEnvironment } from "@/contexts/environment-context"
import { ConversationStyleBadge } from "@/components/conversation-style-badge"
import { CompactStyleSelector } from "@/components/compact-style-selector"

interface SpeechPracticeProps {
  targetLanguage?: string
  initialPrompt?: string
}

export default function SpeechPractice({
  targetLanguage = "en-US",
  initialPrompt = "Let's practice speaking English. I'll listen to you and provide feedback.",
}: SpeechPracticeProps) {
  const [activeTab, setActiveTab] = useState<string>("practice")
  const [practiceMode, setPracticeMode] = useState<"free" | "guided" | "conversation">("free")
  const [currentPrompt, setCurrentPrompt] = useState<string>(initialPrompt)
  const [userTranscript, setUserTranscript] = useState<string>("")
  const [interimTranscript, setInterimTranscript] = useState<string>("")
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [practiceHistory, setPracticeHistory] = useState<Array<{ prompt: string; response: string; score?: number }>>(
    [],
  )
  const { avatarName, avatarVoice } = useAvatar()
  const { toast } = useToast()
  const { messages, setMessages } = useChat()
  const { environment } = useEnvironment()

  // Reference to track if component is mounted
  const isMountedRef = useRef(true)

  // Add language state and handler to the SpeechPractice component
  const [selectedLanguage, setSelectedLanguage] = useState<string>(targetLanguage)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      stopSpeaking()
    }
  }, [])

  // Update prompt when environment changes
  useEffect(() => {
    // Only update if we're already in a practice mode
    if (practiceMode) {
      changePracticeMode(practiceMode, false)
    }
  }, [environment.id])

  // Speak the initial prompt when component mounts
  useEffect(() => {
    const speakInitialPrompt = async () => {
      try {
        setIsSpeaking(true)
        await speak(currentPrompt, targetLanguage, avatarVoice)
      } catch (error) {
        console.error("Failed to speak initial prompt:", error)
      } finally {
        if (isMountedRef.current) {
          setIsSpeaking(false)
        }
      }
    }

    speakInitialPrompt()
  }, [currentPrompt, targetLanguage, avatarVoice])

  const handleTranscriptChange = (transcript: string, isFinal: boolean) => {
    if (isFinal) {
      setUserTranscript((prev) => prev + " " + transcript.trim())
      setInterimTranscript("")

      // Add to chat context if in conversation mode
      if (practiceMode === "conversation") {
        const userMessage = {
          role: "user" as const,
          content: transcript.trim(),
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])

        // Generate a response (in a real app, this would use AI)
        setTimeout(() => {
          const response = generateSimpleResponse(transcript.trim())

          const assistantMessage = {
            role: "assistant" as const,
            content: response,
            timestamp: new Date(),
          }

          setMessages((prev) => [...prev, assistantMessage])

          // Speak the response
          speak(response, targetLanguage, avatarVoice).catch(console.error)
        }, 1000)
      }
    } else {
      setInterimTranscript(transcript)
    }
  }

  const handleSpeakPrompt = async () => {
    if (isSpeaking) {
      stopSpeaking()
      setIsSpeaking(false)
      return
    }

    try {
      setIsSpeaking(true)
      await speak(currentPrompt, targetLanguage, avatarVoice)
    } catch (error) {
      console.error("Failed to speak prompt:", error)
      toast({
        title: "Speech Error",
        description: "Failed to speak the prompt. Please try again.",
        variant: "destructive",
      })
    } finally {
      if (isMountedRef.current) {
        setIsSpeaking(false)
      }
    }
  }

  // Add this function after the other handler functions
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language)
    // In a real implementation, this would update the speech recognition language
    toast({
      title: `Practice language changed to ${language === "en-US" ? "English" : "Spanish"}`,
      description: "Your speech practice language has been updated.",
    })
  }

  const changePrompt = (newPrompt: string) => {
    // Save current practice if there's a transcript
    if (userTranscript.trim()) {
      setPracticeHistory((prev) => [
        ...prev,
        {
          prompt: currentPrompt,
          response: userTranscript,
          score: Math.floor(Math.random() * 30) + 70, // Mock score between 70-100
        },
      ])
    }

    // Set new prompt and clear transcript
    setCurrentPrompt(newPrompt)
    setUserTranscript("")
    setInterimTranscript("")

    // Speak the new prompt
    handleSpeakPrompt()
  }

  const resetPractice = () => {
    // Save current practice if there's a transcript
    if (userTranscript.trim()) {
      setPracticeHistory((prev) => [
        ...prev,
        {
          prompt: currentPrompt,
          response: userTranscript,
          score: Math.floor(Math.random() * 30) + 70, // Mock score between 70-100
        },
      ])
    }

    // Clear transcript
    setUserTranscript("")
    setInterimTranscript("")
  }

  const changePracticeMode = (mode: "free" | "guided" | "conversation", speakPrompt = true) => {
    setPracticeMode(mode)

    // Set appropriate prompt based on mode and environment
    let newPrompt = ""

    switch (mode) {
      case "free":
        newPrompt = "Speak freely about any topic. I'll listen and provide feedback on your English."
        break
      case "guided":
        newPrompt = "Describe your favorite place to visit. What do you like about it?"
        break
      case "conversation":
        newPrompt = `Hello! I'm ${avatarName}. Let's have a conversation in English. How are you today?`
        break
    }

    // Adjust prompt based on environment style
    switch (environment.id) {
      case "casual":
        // Already casual, no need to modify
        break
      case "business":
        if (mode === "free") {
          newPrompt = "Please discuss any professional topic. I'll provide feedback on your business English."
        } else if (mode === "guided") {
          newPrompt = "Describe your ideal workplace or a recent professional achievement."
        } else if (mode === "conversation") {
          newPrompt = `Good day. I'm ${avatarName}. Let's discuss business-related topics. How is your work progressing?`
        }
        break
      case "academic":
        if (mode === "free") {
          newPrompt = "Please elaborate on an academic subject of your choice. I'll provide scholarly feedback."
        } else if (mode === "guided") {
          newPrompt = "Discuss a recent academic paper or research topic that interests you."
        } else if (mode === "conversation") {
          newPrompt = `Greetings. I'm ${avatarName}. Let's engage in academic discourse. What field of study interests you?`
        }
        break
      case "travel":
        if (mode === "free") {
          newPrompt = "Tell me about your travel experiences or places you'd like to visit."
        } else if (mode === "guided") {
          newPrompt = "Describe a memorable trip or a destination you'd like to explore."
        } else if (mode === "conversation") {
          newPrompt = `Hi there! I'm ${avatarName}. Let's talk about travel and adventures. Have you been on any trips lately?`
        }
        break
      case "slang":
        if (mode === "free") {
          newPrompt = "Just chat about whatever's on your mind. I'll help you sound more natural."
        } else if (mode === "guided") {
          newPrompt = "Tell me about your favorite hangout spot or what you do for fun."
        } else if (mode === "conversation") {
          newPrompt = `Hey! I'm ${avatarName}. Let's hang out and chat. What's up with you?`
        }
        break
    }

    if (speakPrompt) {
      changePrompt(newPrompt)
    } else {
      // Just update the prompt without speaking it
      setCurrentPrompt(newPrompt)
    }
  }

  // Simple response generator for conversation mode
  const generateSimpleResponse = (input: string): string => {
    const lowerInput = input.toLowerCase()

    // Base responses
    let response = "That's interesting! Could you tell me more about that?"

    if (lowerInput.includes("how are you")) {
      response = "I'm doing well, thank you for asking! How about you?"
    } else if (lowerInput.includes("weather")) {
      response =
        "I don't actually know the current weather, but I'd be happy to talk about how different weather affects our daily activities."
    } else if (lowerInput.includes("name")) {
      response = `My name is ${avatarName}. I'm your language practice assistant.`
    } else if (lowerInput.includes("hobby") || lowerInput.includes("like to do")) {
      response = "I enjoy helping people learn languages! What are your hobbies?"
    } else if (lowerInput.includes("thank")) {
      response = "You're welcome! Is there anything specific you'd like to practice today?"
    }

    // Adjust response based on environment style
    switch (environment.id) {
      case "casual":
        // Already casual, no need to modify
        break
      case "business":
        response = response
          .replace("I'm doing well", "I'm doing fine")
          .replace("How about you?", "How are you doing today?")
          .replace("I'd be happy to", "I would be pleased to")
          .replace("I enjoy", "I find satisfaction in")
          .replace("You're welcome!", "You're most welcome.")
        break
      case "academic":
        response = response
          .replace("I'm doing well", "I'm quite well")
          .replace("How about you?", "How are you faring?")
          .replace("I'd be happy to", "I would be interested in discussing")
          .replace("I enjoy", "I derive enjoyment from")
          .replace("You're welcome!", "You are certainly welcome.")
        break
      case "travel":
        response = response
          .replace("I'm doing well", "I'm having a great day")
          .replace("How about you?", "How's your day going?")
          .replace("I'd be happy to", "I can definitely help with")
          .replace("You're welcome!", "No problem at all!")
        break
      case "slang":
        response = response
          .replace("I'm doing well", "I'm chillin'")
          .replace("How about you?", "What's up with you?")
          .replace("I'd be happy to", "I'm totally down to")
          .replace("I enjoy", "I'm really into")
          .replace("You're welcome!", "No worries!")
        break
    }

    return response
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // If changing to practice tab, reset the transcript
    if (value === "practice" && activeTab !== "practice") {
      resetPractice()
    }
  }

  // Sample guided practice prompts
  const guidedPrompts = [
    "Describe your favorite place to visit. What do you like about it?",
    "Talk about your daily routine. What do you do in the morning?",
    "If you could travel anywhere, where would you go and why?",
    "Describe your favorite meal. How is it prepared?",
    "What do you like to do in your free time? Why do you enjoy these activities?",
  ]

  return (
    <div className="space-y-6">
      <Card className="border border-indigo-100">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-indigo-700">Speech Practice</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                {targetLanguage === "en-US" ? "English" : targetLanguage}
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {practiceMode === "free"
                  ? "Free Practice"
                  : practiceMode === "guided"
                    ? "Guided Practice"
                    : "Conversation"}
              </Badge>
              <ConversationStyleBadge />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="practice" value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="practice">Practice</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="practice" className="space-y-4">
              {/* Practice Mode Selector */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={practiceMode === "free" ? "default" : "outline"}
                  size="sm"
                  onClick={() => changePracticeMode("free")}
                  className="flex-1"
                >
                  Free Practice
                </Button>
                <Button
                  variant={practiceMode === "guided" ? "default" : "outline"}
                  size="sm"
                  onClick={() => changePracticeMode("guided")}
                  className="flex-1"
                >
                  Guided Practice
                </Button>
                <Button
                  variant={practiceMode === "conversation" ? "default" : "outline"}
                  size="sm"
                  onClick={() => changePracticeMode("conversation")}
                  className="flex-1"
                >
                  Conversation
                </Button>
              </div>

              {/* Conversation Style Selector - Now directly in the practice tab */}
              <CompactStyleSelector />

              {/* Current Prompt */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 relative">
                <div className="flex items-start">
                  <div className="mr-8 flex-1">
                    <p className="text-indigo-800">{currentPrompt}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 rounded-full ${isSpeaking ? "bg-indigo-100 text-indigo-700" : ""}`}
                    onClick={handleSpeakPrompt}
                  >
                    {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Guided Practice Prompts */}
              {practiceMode === "guided" && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {guidedPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="bg-white text-xs"
                      onClick={() => changePrompt(prompt)}
                    >
                      {prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt}
                    </Button>
                  ))}
                </div>
              )}

              {/* Speech Recognition */}
              <div className="mt-6">
                <RealTimeSpeechRecognition
                  targetLanguage={targetLanguage}
                  onTranscriptChange={handleTranscriptChange}
                  showFeedback={true}
                />
              </div>

              {/* Reset Button */}
              {userTranscript && (
                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm" onClick={resetPractice} className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    New Practice
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Practice History</h3>

                {practiceHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No practice history yet. Complete a practice session to see it here.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {practiceHistory.map((practice, index) => (
                      <Card key={index} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">Prompt:</p>
                              <p className="text-gray-600 text-sm mb-2">{practice.prompt}</p>

                              <p className="font-medium text-gray-800">Your response:</p>
                              <p className="text-gray-600 text-sm">{practice.response}</p>
                            </div>

                            {practice.score && (
                              <div className="bg-indigo-50 p-2 rounded-full h-12 w-12 flex items-center justify-center">
                                <span className="text-indigo-700 font-medium">{practice.score}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Practice Settings</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Language</span>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedLanguage === "en-US" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleLanguageChange("en-US")}
                        className="min-w-[80px]"
                      >
                        English
                      </Button>
                      <Button
                        variant={selectedLanguage === "es-ES" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleLanguageChange("es-ES")}
                        className="min-w-[80px]"
                      >
                        Spanish
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span>Feedback Level</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-w-[80px] bg-green-50 text-green-700 border-green-200"
                      >
                        Basic
                      </Button>
                      <Button variant="outline" size="sm" className="min-w-[80px]">
                        Detailed
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span>Auto-Speak Prompts</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-w-[80px] bg-green-50 text-green-700 border-green-200"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Enabled
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span>Continuous Listening</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-w-[80px] bg-green-50 text-green-700 border-green-200"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Enabled
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
