"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, User } from "lucide-react"

export default function SimpleTeacher() {
  const [speaking, setSpeaking] = useState(false)

  const handleSpeakClick = () => {
    if (!speaking) {
      // Start speaking
      const utterance = new SpeechSynthesisUtterance("Hello! I'm your English teacher. How can I help you today?")
      utterance.lang = "en-US"

      // Set up event handlers
      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)

      window.speechSynthesis.speak(utterance)
    } else {
      // Stop speaking
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="relative w-48 h-48 mb-6 rounded-full bg-blue-100 flex items-center justify-center">
        <User className="w-24 h-24 text-blue-500" />
      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-blue-700">English Teacher</h2>
        <p className="text-gray-600">Interactive learning assistant</p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className={`${speaking ? "bg-red-100" : "bg-blue-100"}`}
        onClick={handleSpeakClick}
      >
        {speaking ? (
          <>
            <Pause className="mr-2 h-4 w-4" />
            Stop Speaking
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Start Speaking
          </>
        )}
      </Button>
    </div>
  )
}
