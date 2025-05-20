"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX } from "lucide-react"
import { stopSpeaking } from "@/lib/simple-tts"

interface SpeechControlProps {
  isSpeaking: boolean
  onToggleSpeaker?: (enabled: boolean) => void
}

export default function SpeechControl({ isSpeaking, onToggleSpeaker }: SpeechControlProps) {
  const [speakerEnabled, setSpeakerEnabled] = useState(true)

  // Effect to handle speaker state changes
  useEffect(() => {
    if (!speakerEnabled && isSpeaking) {
      stopSpeaking()
    }
  }, [speakerEnabled, isSpeaking])

  const toggleSpeaker = () => {
    const newState = !speakerEnabled
    setSpeakerEnabled(newState)

    if (!newState && isSpeaking) {
      stopSpeaking()
    }

    if (onToggleSpeaker) {
      onToggleSpeaker(newState)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={`rounded-full ${speakerEnabled ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}
      onClick={toggleSpeaker}
      title={speakerEnabled ? "Desativar alto-falante" : "Ativar alto-falante"}
    >
      {speakerEnabled ? (
        <>
          <Volume2 className="h-4 w-4 mr-1" />
          <span className="text-xs">Som Ativado</span>
        </>
      ) : (
        <>
          <VolumeX className="h-4 w-4 mr-1" />
          <span className="text-xs">Som Desativado</span>
        </>
      )}
    </Button>
  )
}
