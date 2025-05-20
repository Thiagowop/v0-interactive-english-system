"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, User } from "lucide-react"

export default function FallbackTeacher() {
  const [speaking, setSpeaking] = useState(false)

  const handleSpeakClick = async () => {
    setSpeaking(!speaking)

    if (!speaking) {
      try {
        // Try to use browser's built-in TTS as fallback
        const utterance = new SpeechSynthesisUtterance("Hello! I'm your English teacher. How can I help you today?")
        utterance.lang = "en-US"
        window.speechSynthesis.speak(utterance)
      } catch (error) {
        console.error("Speech synthesis failed:", error)
      }
    } else {
      // Stop speaking
      window.speechSynthesis.cancel()
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="relative w-48 h-48 mb-6 rounded-full bg-blue-100 flex items-center justify-center">
        <User className="w-24 h-24 text-blue-500" />
        {/* Alternatively, use a static image */}
        {/* <Image 
          src="/teacher-static.png" 
          alt="English Teacher" 
          width={192} 
          height={192} 
          className="rounded-full object-cover"
        /> */}
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
