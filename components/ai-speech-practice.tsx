"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Mic, MicOff, Send, RefreshCw, Volume2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { speak } from "@/lib/simple-tts"
import { useAvatar } from "@/contexts/avatar-context"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface AISpeechPracticeProps {
  initialPrompt?: string
  language?: string
}

export default function AISpeechPractice({
  initialPrompt = "Let's practice speaking English.",
  language = "en-US",
}: AISpeechPracticeProps) {
  // State for speech recognition
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [soundLevel, setSoundLevel] = useState(0)

  // State for UI
  const [activeTab, setActiveTab] = useState("practice")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [practiceMode, setPracticeMode] = useState<"free" | "guided" | "conversation">("free")

  // References
  const recognitionRef = useRef<any>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const soundLevelIntervalRef = useRef<number | null>(null)

  // Hooks
  const { avatarVoice } = useAvatar()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // AI Chat integration
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "1",
        role: "system",
        content: "You are an AI English teacher assistant specialized in providing feedback on spoken English.",
      },
      {
        id: "2",
        role: "assistant",
        content: initialPrompt,
      },
    ],
  })

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if browser supports speech recognition
      if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        recognitionRef.current = new SpeechRecognition()

        // Configure recognition
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = language

        // Set up event handlers
        recognitionRef.current.onstart = () => {
          setIsListening(true)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
          // If we're supposed to be listening but recognition stopped, restart it
          if (isListening) {
            try {
              recognitionRef.current?.start()
            } catch (error) {
              console.error("Error restarting speech recognition:", error)
            }
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error)
          // Don't report no-speech as an error to the UI
          if (event.error !== "no-speech") {
            toast({
              title: "Speech Recognition Error",
              description: `Error: ${event.error}. Please try again.`,
              variant: "destructive",
            })
          }
        }

        recognitionRef.current.onresult = (event: any) => {
          let interimText = ""
          let finalText = ""

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalText += event.results[i][0].transcript
            } else {
              interimText += event.results[i][0].transcript
            }
          }

          if (finalText) {
            setTranscript((prev) => prev + " " + finalText.trim())
            setInterimTranscript("")
          }

          if (interimText) {
            setInterimTranscript(interimText)
          }
        }
      }
    }

    return () => {
      // Clean up
      stopAudioAnalysis()
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (error) {
          // Ignore errors when stopping
        }
      }
    }
  }, [language, toast])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Toggle speech recognition
  const toggleListening = async () => {
    if (!isListening) {
      try {
        await startAudioAnalysis()
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (error) {
        console.error("Error starting speech recognition:", error)
        toast({
          title: "Speech Recognition Error",
          description: "Failed to start speech recognition. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      recognitionRef.current?.stop()
      stopAudioAnalysis()
      setIsListening(false)
    }
  }

  // Audio level analysis for visualizing microphone input
  const startAudioAnalysis = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("getUserMedia not supported")
      return
    }

    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      analyzerRef.current = audioContext.createAnalyser()
      analyzerRef.current.fftSize = 256
      microphoneRef.current = audioContext.createMediaStreamSource(mediaStreamRef.current)
      microphoneRef.current.connect(analyzerRef.current)

      analyzeSoundLevel()
    } catch (error) {
      console.error("Error accessing microphone:", error)
      throw error
    }
  }

  const stopAudioAnalysis = () => {
    if (soundLevelIntervalRef.current) {
      clearInterval(soundLevelIntervalRef.current)
      soundLevelIntervalRef.current = null
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect()
      microphoneRef.current = null
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    analyzerRef.current = null
  }

  const analyzeSoundLevel = () => {
    if (!analyzerRef.current) return

    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount)

    soundLevelIntervalRef.current = window.setInterval(() => {
      if (!analyzerRef.current) return

      analyzerRef.current.getByteFrequencyData(dataArray)

      // Calculate average volume level
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i]
      }
      const average = sum / dataArray.length

      // Normalize to 0-100 range
      const normalizedLevel = Math.min(100, Math.max(0, average))

      setSoundLevel(normalizedLevel)
    }, 100)
  }

  // Submit transcript for AI feedback
  const submitTranscript = () => {
    if (!transcript.trim()) {
      toast({
        title: "No Speech Detected",
        description: "Please speak something before submitting for feedback.",
        variant: "default",
      })
      return
    }

    // Add the transcript as a user message
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        role: "user",
        content: transcript,
      },
    ])

    // Clear the transcript for the next practice
    setTranscript("")
    setInterimTranscript("")
  }

  // Reset practice
  const resetPractice = () => {
    setTranscript("")
    setInterimTranscript("")
    if (isListening) {
      toggleListening()
    }
  }

  // Speak the assistant's message
  const speakMessage = async (message: string) => {
    try {
      setIsSpeaking(true)
      await speak(message, language, avatarVoice)
    } catch (error) {
      console.error("Failed to speak:", error)
    } finally {
      setIsSpeaking(false)
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

  // Change practice mode
  const changePracticeMode = (mode: "free" | "guided" | "conversation") => {
    setPracticeMode(mode)
    resetPractice()

    // Set appropriate prompt based on mode
    let prompt = ""
    switch (mode) {
      case "free":
        prompt = "Speak freely about any topic. I'll listen and provide feedback on your English."
        break
      case "guided":
        prompt = "Describe your favorite place to visit. What do you like about it?"
        break
      case "conversation":
        prompt = "Let's have a conversation in English. How are you today?"
        break
    }

    // Add the prompt as an assistant message
    setMessages([
      {
        id: "1",
        role: "system",
        content: "You are an AI English teacher assistant specialized in providing feedback on spoken English.",
      },
      {
        id: Date.now().toString(),
        role: "assistant",
        content: prompt,
      },
    ])
  }

  return (
    <Card className="border border-indigo-100">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-indigo-700">AI Speech Practice</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={practiceMode === "free" ? "default" : "outline"}
              size="sm"
              onClick={() => changePracticeMode("free")}
              className="text-xs"
            >
              Free Practice
            </Button>
            <Button
              variant={practiceMode === "guided" ? "default" : "outline"}
              size="sm"
              onClick={() => changePracticeMode("guided")}
              className="text-xs"
            >
              Guided Practice
            </Button>
            <Button
              variant={practiceMode === "conversation" ? "default" : "outline"}
              size="sm"
              onClick={() => changePracticeMode("conversation")}
              className="text-xs"
            >
              Conversation
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Guided Practice Prompts */}
        {practiceMode === "guided" && (
          <div className="flex flex-wrap gap-2 mt-2">
            {guidedPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="bg-white text-xs"
                onClick={() => {
                  setMessages([
                    {
                      id: "1",
                      role: "system",
                      content:
                        "You are an AI English teacher assistant specialized in providing feedback on spoken English.",
                    },
                    {
                      id: Date.now().toString(),
                      role: "assistant",
                      content: prompt,
                    },
                  ])
                }}
              >
                {prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt}
              </Button>
            ))}
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {messages
              .filter((m) => m.role !== "system")
              .map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user" ? "bg-indigo-100 text-indigo-900" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() => speakMessage(message.content)}
                        disabled={isSpeaking}
                      >
                        <Volume2 className={`h-3 w-3 mr-1 ${isSpeaking ? "animate-pulse" : ""}`} />
                        {isSpeaking ? "Speaking..." : "Speak"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-gray-100">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"></div>
                    <div
                      className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Speech Recognition Area */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Your Speech</h3>
            <div className="flex gap-2">
              <Button
                variant={isListening ? "destructive" : "default"}
                size="sm"
                onClick={toggleListening}
                className="flex items-center gap-1"
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isListening ? "Stop" : "Start"} Recording
              </Button>
              {transcript && (
                <Button variant="outline" size="sm" onClick={resetPractice}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Sound level indicator */}
          {isListening && (
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mb-4">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-indigo-500"
                style={{ width: `${soundLevel}%` }}
                animate={{ width: `${soundLevel}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          )}

          <div className="min-h-[100px] max-h-[150px] overflow-y-auto bg-white p-3 rounded-md border border-gray-200">
            {transcript && <p className="text-gray-800 mb-2">{transcript}</p>}
            {interimTranscript && <p className="text-gray-500 italic">{interimTranscript}</p>}
            {!transcript && !interimTranscript && (
              <p className="text-gray-400 italic">
                {isListening ? "Listening... Start speaking." : "Click 'Start Recording' to begin speech recognition."}
              </p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button
          onClick={submitTranscript}
          disabled={!transcript.trim() || isLoading}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Send className="h-4 w-4 mr-2" />
          Submit for Feedback
        </Button>
      </CardFooter>
    </Card>
  )
}
