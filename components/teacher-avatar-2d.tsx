"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2 } from "lucide-react"
import { speak, stopSpeaking } from "@/lib/simple-tts"
import { motion, AnimatePresence } from "framer-motion"
import { useAvatar } from "@/contexts/avatar-context"
import { useToast } from "@/hooks/use-toast"
import { useLanguage, useTranslation } from "@/components/language-context"

export default function TeacherAvatar2D() {
  const { avatarType, avatarName, avatarVoice } = useAvatar()
  const [speaking, setSpeaking] = useState(false)
  const [greeting, setGreeting] = useState(``)
  const [showSpeechBubble, setShowSpeechBubble] = useState(false)
  const speakAttemptRef = useRef(0)
  const { toast } = useToast()
  const { speechLanguage } = useLanguage()
  const t = useTranslation()

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  useEffect(() => {
    // Show speech bubble after a short delay
    const timer = setTimeout(() => {
      setShowSpeechBubble(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Update greeting when avatar or language changes
  useEffect(() => {
    setGreeting(t("teacher.greeting"))
  }, [avatarName, t])

  const handleSpeakClick = async () => {
    if (!speaking) {
      try {
        setSpeaking(true)
        const currentAttempt = ++speakAttemptRef.current

        console.log(`Speaking with ${avatarVoice} voice in ${speechLanguage}: "${greeting}"`)
        await speak(greeting, speechLanguage, avatarVoice)

        // Only update state if this is still the current speak attempt
        if (currentAttempt === speakAttemptRef.current) {
          setSpeaking(false)
        }
      } catch (error) {
        console.error("Failed to speak:", error)

        // Show a toast only for unexpected errors (not for intentional stops)
        if (error instanceof Error && !error.message.includes("interrupted")) {
          toast({
            title: "Speech Error",
            description: "There was a problem with the speech synthesis. Please try again.",
            variant: "destructive",
          })
        }

        setSpeaking(false)
      }
    } else {
      stopSpeaking()
      setSpeaking(false)
    }
  }

  const getRandomGreeting = () => {
    return t("teacher.greeting")
  }

  const handleAvatarClick = () => {
    // If already speaking, stop first
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
    }

    setGreeting(getRandomGreeting())
    setShowSpeechBubble(true)

    // Small delay to ensure previous speech is fully stopped
    setTimeout(() => {
      handleSpeakClick()
    }, 100)
  }

  // Get avatar image based on selected type
  const getAvatarImage = () => {
    return avatarType === "female" ? "/cheerful-teacher-avatar.png" : "/male-teacher-avatar.png"
  }

  // Get gradient colors based on avatar type
  const getGradientColors = () => {
    return avatarType === "female" ? "from-indigo-100 to-purple-100" : "from-blue-100 to-cyan-100"
  }

  const getButtonColors = () => {
    return avatarType === "female"
      ? "bg-indigo-100 border-indigo-200 text-indigo-700"
      : "bg-blue-100 border-blue-200 text-blue-700"
  }

  const getSpeakingIndicatorColors = () => {
    return avatarType === "female" ? "bg-indigo-600" : "bg-blue-600"
  }

  const getNameGradient = () => {
    return avatarType === "female" ? "from-indigo-600 to-purple-600" : "from-blue-600 to-cyan-600"
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      {/* Speech Bubble - Fixed positioning to prevent overlap */}
      <AnimatePresence>
        {showSpeechBubble && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 left-4 right-4 bg-white p-4 rounded-2xl shadow-md border border-gray-200 z-10"
          >
            <div className="relative">
              <p className="text-gray-800 font-medium">{greeting}</p>
              <div className="absolute -bottom-8 left-10 w-4 h-8 overflow-hidden">
                <div className="absolute w-4 h-4 bg-white rotate-45 transform origin-top-left translate-y-1/2 border-b border-r border-gray-200"></div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={() => setShowSpeechBubble(false)}
              >
                ×
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teacher Avatar */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={`relative w-64 h-64 mb-6 rounded-full bg-gradient-to-br ${getGradientColors()} flex items-center justify-center cursor-pointer shadow-lg border-4 border-white`}
        onClick={handleAvatarClick}
      >
        <motion.img
          src={getAvatarImage()}
          alt={`English Teacher - ${avatarName}`}
          className="w-full h-full object-cover rounded-full"
          animate={{ scale: speaking ? [1, 1.03, 1] : 1 }}
          transition={{ repeat: speaking ? Number.POSITIVE_INFINITY : 0, duration: 1 }}
        />
        {speaking && (
          <motion.div
            className={`absolute -right-2 -bottom-2 ${getSpeakingIndicatorColors()} text-white p-2 rounded-full shadow-lg`}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}
          >
            <Volume2 className="h-5 w-5" />
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mb-6"
      >
        <h2 className={`text-2xl font-bold bg-gradient-to-r ${getNameGradient()} text-transparent bg-clip-text`}>
          {avatarName}
        </h2>
        <p className="text-gray-600">{t("teacher.assistant")}</p>
      </motion.div>

      <Button
        variant="outline"
        size="lg"
        className={`${
          speaking ? "bg-red-100 border-red-200 text-red-700" : getButtonColors()
        } rounded-full transition-all duration-300 shadow-sm hover:shadow-md`}
        onClick={handleSpeakClick}
      >
        {speaking ? (
          <>
            <Pause className="mr-2 h-4 w-4" />
            {t("teacher.stopSpeaking")}
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            {t("teacher.startSpeaking")}
          </>
        )}
      </Button>
    </div>
  )
}
