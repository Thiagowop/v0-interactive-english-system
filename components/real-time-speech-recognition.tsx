"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Volume2, VolumeX, BarChart3 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { getSpeechRecognitionService } from "@/lib/speech-recognition-service"
import {
  analyzeLanguage,
  getQuickFeedback,
  type FeedbackResult,
  type LanguageFeedback,
} from "@/lib/language-feedback-service"
import { useAvatar } from "@/contexts/avatar-context"
import { speak, stopSpeaking } from "@/lib/simple-tts"
import SpeechDetectionIndicator from "./speech-detection-indicator"

interface RealTimeSpeechRecognitionProps {
  targetLanguage?: string
  onTranscriptChange?: (transcript: string, isFinal: boolean) => void
  showFeedback?: boolean
}

export default function RealTimeSpeechRecognition({
  targetLanguage = "en-US",
  onTranscriptChange,
  showFeedback = true,
}: RealTimeSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [soundLevel, setSoundLevel] = useState(0)
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null)
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [noSpeechDetected, setNoSpeechDetected] = useState(false)
  const { avatarVoice } = useAvatar()
  const { toast } = useToast()

  const lastAnalysisRef = useRef("")
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const speechService = getSpeechRecognitionService()

  // Initialize speech recognition
  useEffect(() => {
    speechService.setOptions({
      language: targetLanguage,
      continuous: true,
      interimResults: true,
    })

    speechService.setCallbacks({
      onStart: () => setIsListening(true),
      onEnd: () => {
        setIsListening(false)
        setIsSpeaking(false)
        setNoSpeechDetected(false)
      },
      onError: (error) => {
        // Only show errors that aren't "no-speech"
        if (error !== "no-speech") {
          toast({
            title: "Speech Recognition Error",
            description: `Error: ${error}. Please try again.`,
            variant: "destructive",
          })
        }
      },
      onResult: handleTranscriptResult,
      onSoundLevel: setSoundLevel,
      onNoSpeech: () => {
        setNoSpeechDetected(true)
        setIsSpeaking(false)
      },
      onSilence: () => {
        setIsSpeaking(false)
      },
      onSpeechStart: () => {
        setIsSpeaking(true)
        setNoSpeechDetected(false)
      },
    })

    return () => {
      // Clean up
      if (isListening) {
        speechService.stop()
      }
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current)
      }
    }
  }, [targetLanguage])

  const handleTranscriptResult = async (text: string, isFinal: boolean) => {
    if (isFinal) {
      // Add a small delay to ensure complete processing
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Update the final transcript
      const newTranscript = transcript + " " + text
      setTranscript(newTranscript.trim())
      setInterimTranscript("")

      // Notify parent component if needed
      if (onTranscriptChange) {
        onTranscriptChange(newTranscript.trim(), true)
      }

      // Analyze the text for feedback
      if (showFeedback) {
        // First provide quick feedback
        const quickFeedback = getQuickFeedback(text)
        if (quickFeedback.feedback.length > 0) {
          setFeedback(quickFeedback)

          // Speak the feedback if speaker is enabled
          if (isSpeakerEnabled && quickFeedback.feedback.length > 0) {
            const feedbackText = quickFeedback.feedback[0].explanation
            speak(feedbackText, targetLanguage, avatarVoice)
          }
        }

        // Then schedule a more detailed analysis if the text is different enough
        if (text.length > 5 && text !== lastAnalysisRef.current) {
          lastAnalysisRef.current = text

          // Clear any existing timeout
          if (analysisTimeoutRef.current) {
            clearTimeout(analysisTimeoutRef.current)
          }

          // Schedule the analysis after a longer delay
          analysisTimeoutRef.current = setTimeout(async () => {
            setIsAnalyzing(true)
            try {
              const detailedFeedback = await analyzeLanguage(text, targetLanguage)
              setFeedback(detailedFeedback)

              // Speak the feedback if speaker is enabled and there's feedback
              if (isSpeakerEnabled && detailedFeedback.feedback.length > 0) {
                const feedbackText = detailedFeedback.feedback[0].explanation
                speak(feedbackText, targetLanguage, avatarVoice)
              }
            } catch (error) {
              console.error("Error analyzing speech:", error)
            } finally {
              setIsAnalyzing(false)
            }
          }, 1500) // Increased from 1000ms to 1500ms
        }
      }
    } else {
      // Update the interim transcript
      setInterimTranscript(text)

      // Notify parent component if needed
      if (onTranscriptChange) {
        onTranscriptChange(text, false)
      }
    }
  }

  const toggleListening = () => {
    const newState = speechService.toggle()
    setIsListening(newState)

    if (!newState) {
      // If stopping, clear interim transcript
      setInterimTranscript("")
      setIsSpeaking(false)
      setNoSpeechDetected(false)
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled)
    if (isSpeakerEnabled) {
      stopSpeaking()
    }
  }

  const renderFeedback = () => {
    if (!feedback || feedback.feedback.length === 0) return null

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mt-4"
        >
          <Card className="border border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <h3 className="font-medium text-amber-800 mb-2">Feedback</h3>
              <div className="space-y-3">
                {feedback.feedback.map((item, index) => (
                  <FeedbackItem key={index} feedback={item} />
                ))}
              </div>

              {feedback.suggestions && feedback.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <p className="text-sm font-medium text-amber-800">Suggestions:</p>
                  <ul className="list-disc list-inside text-sm text-amber-700 mt-1">
                    {feedback.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  const renderAnalytics = () => {
    if (!showAnalytics || !feedback || !feedback.overallScore) return null

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4"
        >
          <Card className="border border-indigo-200 bg-indigo-50">
            <CardContent className="p-4">
              <h3 className="font-medium text-indigo-800 mb-2">Performance Analytics</h3>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-indigo-700 mb-1">Overall Score</p>
                  <div className="w-full bg-indigo-200 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{ width: `${feedback.overallScore}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-xs text-indigo-600 mt-1">{feedback.overallScore}/100</p>
                </div>

                {feedback.strengths && feedback.strengths.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-indigo-700">Strengths:</p>
                    <ul className="list-disc list-inside text-sm text-indigo-600 mt-1">
                      {feedback.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleListening}
            variant={isListening ? "destructive" : "default"}
            className={`relative ${isListening ? "bg-red-500 hover:bg-red-600" : ""} w-full sm:w-auto`}
          >
            {isListening ? (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Stop Listening</span>
                <span className="absolute -right-1 -top-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Start Listening</span>
              </>
            )}
          </Button>

          {/* Speech detection indicator */}
          {isListening && (
            <div className="ml-2">
              <SpeechDetectionIndicator
                isListening={isListening}
                soundLevel={soundLevel}
                isSpeaking={isSpeaking}
                noSpeechDetected={noSpeechDetected}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="icon"
            className={`rounded-full ${isSpeakerEnabled ? "bg-indigo-100 text-indigo-700" : ""}`}
            onClick={toggleSpeaker}
            title={isSpeakerEnabled ? "Disable speaker" : "Enable speaker"}
          >
            {isSpeakerEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className={`rounded-full ${showAnalytics ? "bg-indigo-100 text-indigo-700" : ""}`}
            onClick={() => setShowAnalytics(!showAnalytics)}
            title={showAnalytics ? "Hide analytics" : "Show analytics"}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="border border-indigo-100">
        <CardContent className="p-4">
          <div className="min-h-[100px] max-h-[200px] overflow-y-auto">
            {transcript && <p className="text-gray-800 mb-2">{transcript}</p>}
            {interimTranscript && <p className="text-gray-500 italic">{interimTranscript}</p>}
            {!transcript && !interimTranscript && (
              <p className="text-gray-400 italic">
                {isListening ? "Listening... Start speaking." : "Click 'Start Listening' to begin speech recognition."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {showFeedback && renderFeedback()}
      {renderAnalytics()}
    </div>
  )
}

// Component to display individual feedback items
function FeedbackItem({ feedback }: { feedback: LanguageFeedback }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minor":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "moderate":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "major":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "grammar":
        return "🔤"
      case "pronunciation":
        return "🗣️"
      case "vocabulary":
        return "📚"
      case "fluency":
        return "🌊"
      default:
        return "📝"
    }
  }

  return (
    <div className={`p-3 rounded-lg border ${getSeverityColor(feedback.severity)}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{getTypeIcon(feedback.type)}</span>
        <div className="flex-1">
          <div className="flex justify-between">
            <p className="font-medium capitalize">{feedback.type}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white bg-opacity-50 capitalize">
              {feedback.severity}
            </span>
          </div>

          <div className="mt-1">
            <p className="text-sm line-through">{feedback.originalText}</p>
            {feedback.correctedText && <p className="text-sm font-medium">{feedback.correctedText}</p>}
          </div>

          <p className="text-sm mt-2">{feedback.explanation}</p>
        </div>
      </div>
    </div>
  )
}
