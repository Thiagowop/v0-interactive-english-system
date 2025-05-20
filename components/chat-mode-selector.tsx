"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, Mic, HelpCircle } from "lucide-react"

type ChatMode = "realtime" | "transcription"

interface ChatModeSelectorProps {
  initialMode: ChatMode
  onModeChange: (mode: ChatMode) => void
}

export default function ChatModeSelector({ initialMode, onModeChange }: ChatModeSelectorProps) {
  const [mode, setMode] = useState<ChatMode>(initialMode)
  const [showRealtimeTooltip, setShowRealtimeTooltip] = useState(false)
  const [showTranscriptionTooltip, setShowTranscriptionTooltip] = useState(false)

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode)
    onModeChange(newMode)
  }

  return (
    <div className="flex items-center mb-4">
      <div className="text-sm text-gray-500 mr-2">Modo:</div>
      <div className="flex space-x-2">
        <div className="relative">
          <Button
            variant={mode === "realtime" ? "default" : "outline"}
            size="sm"
            className={`px-2 py-1 h-8 text-xs flex items-center gap-1 min-w-[100px] ${
              mode === "realtime"
                ? "bg-indigo-600 hover:bg-indigo-700 border-transparent"
                : "text-gray-700 border-gray-300"
            }`}
            onClick={() => handleModeChange("realtime")}
          >
            <MessageSquare className="h-3 w-3 flex-shrink-0" />
            <span>Tempo Real</span>
          </Button>
          <div
            className="absolute -right-1 -top-1 cursor-help"
            onMouseEnter={() => setShowRealtimeTooltip(true)}
            onMouseLeave={() => setShowRealtimeTooltip(false)}
          >
            <HelpCircle className="h-3.5 w-3.5 text-gray-500" />
          </div>
          {showRealtimeTooltip && (
            <div className="absolute z-50 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg -top-2 left-full ml-2">
              No modo Tempo Real, suas falas são processadas imediatamente e o assistente responde automaticamente.
            </div>
          )}
        </div>

        <div className="relative">
          <Button
            variant={mode === "transcription" ? "default" : "outline"}
            size="sm"
            className={`px-2 py-1 h-8 text-xs flex items-center gap-1 min-w-[100px] ${
              mode === "transcription"
                ? "bg-indigo-600 hover:bg-indigo-700 border-transparent"
                : "text-gray-700 border-gray-300"
            }`}
            onClick={() => handleModeChange("transcription")}
          >
            <Mic className="h-3 w-3 flex-shrink-0" />
            <span>Transcrição</span>
          </Button>
          <div
            className="absolute -right-1 -top-1 cursor-help"
            onMouseEnter={() => setShowTranscriptionTooltip(true)}
            onMouseLeave={() => setShowTranscriptionTooltip(false)}
          >
            <HelpCircle className="h-3.5 w-3.5 text-gray-500" />
          </div>
          {showTranscriptionTooltip && (
            <div className="absolute z-50 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg -top-2 left-full ml-2">
              No modo Transcrição, sua fala é convertida em texto e você pode editar antes de enviar.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
