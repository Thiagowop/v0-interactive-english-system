"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, User, X } from "lucide-react"
import { speak, stopSpeaking } from "@/lib/simple-tts"
import TeacherAvatar3D from "@/components/teacher-avatar-3d"

interface TeacherAvatarProps {
  showAvatar3D: boolean
  setShowAvatar3D: (show: boolean) => void
}

export default function TeacherAvatar({ showAvatar3D, setShowAvatar3D }: TeacherAvatarProps) {
  const [speaking, setSpeaking] = useState(false)

  const handleSpeakClick = async () => {
    if (!speaking) {
      try {
        setSpeaking(true)
        await speak("Hello! I'm your English teacher. How can I help you today?", "en-US")
      } catch (error) {
        console.error("Failed to speak:", error)
      } finally {
        setSpeaking(false)
      }
    } else {
      stopSpeaking()
      setSpeaking(false)
    }
  }

  // If 3D avatar is shown, render it in a modal-like overlay
  if (showAvatar3D) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl w-[90vw] h-[90vh] max-w-4xl max-h-[80vh] relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10"
            onClick={() => setShowAvatar3D(false)}
          >
            <X />
          </Button>
          <TeacherAvatar3D />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {/* Teacher Avatar (2D version) */}
      <div
        className="relative w-48 h-48 mb-6 rounded-full bg-blue-100 flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors"
        onClick={() => setShowAvatar3D(true)}
      >
        <User className="w-24 h-24 text-blue-500" />
        <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
          Click for 3D
        </div>
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
