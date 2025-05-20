"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface SpeechDetectionIndicatorProps {
  isListening: boolean
  soundLevel: number
  isSpeaking: boolean
  noSpeechDetected: boolean
}

export default function SpeechDetectionIndicator({
  isListening,
  soundLevel,
  isSpeaking,
  noSpeechDetected,
}: SpeechDetectionIndicatorProps) {
  const [status, setStatus] = useState<"idle" | "listening" | "speaking" | "no-speech">("idle")

  useEffect(() => {
    if (!isListening) {
      setStatus("idle")
    } else if (noSpeechDetected) {
      setStatus("no-speech")
    } else if (isSpeaking || soundLevel > 20) {
      setStatus("speaking")
    } else {
      setStatus("listening")
    }
  }, [isListening, soundLevel, isSpeaking, noSpeechDetected])

  return (
    <div className="flex items-center justify-center">
      <div className="relative h-8 w-8">
        {/* Base circle */}
        <div
          className={`absolute inset-0 rounded-full transition-colors duration-300 ${
            status === "idle"
              ? "bg-gray-200"
              : status === "listening"
                ? "bg-indigo-100"
                : status === "speaking"
                  ? "bg-indigo-200"
                  : "bg-amber-200"
          }`}
        />

        {/* Animated wave - only show when listening */}
        {isListening && (
          <motion.div
            className={`absolute inset-0 rounded-full ${
              status === "speaking" ? "bg-indigo-400" : status === "no-speech" ? "bg-amber-400" : "bg-indigo-300"
            }`}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{
              scale: [0.8, 1 + soundLevel * 0.005],
              opacity: [0.5, 0.2],
            }}
            transition={{
              duration: 1,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />
        )}

        {/* Inner circle - indicates status */}
        <div
          className={`absolute inset-2 rounded-full transition-colors duration-300 ${
            status === "idle"
              ? "bg-gray-400"
              : status === "listening"
                ? "bg-indigo-500"
                : status === "speaking"
                  ? "bg-indigo-600"
                  : "bg-amber-500"
          }`}
        />
      </div>

      {/* Status text */}
      <span className="ml-2 text-xs text-gray-600">
        {status === "idle" && "Microphone off"}
        {status === "listening" && "Listening..."}
        {status === "speaking" && "Speech detected"}
        {status === "no-speech" && "No speech detected"}
      </span>
    </div>
  )
}
