"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useChat } from "@/contexts/chat-context"
import { useAvatar } from "@/contexts/avatar-context"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  History,
  Settings,
  User,
  GraduationCap,
  MessageSquare,
  VolumeX,
  Volume2,
  Mic,
  MicOff,
  BookMarked,
  BarChart3,
  Headphones,
} from "lucide-react"
import { speak, stopSpeaking, isSpeechActive } from "@/lib/simple-tts"
import { useToast } from "@/hooks/use-toast"

// Import the new components
import { useLanguage, useTranslation } from "@/components/language-context"
import SidebarButton from "@/components/sidebar-button"
import LanguageSwitcher from "@/components/language-switcher"
import EnvironmentSelector from "@/components/environment-selector"

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("lessons")
  const [progress, setProgress] = useState(35)
  const [micEnabled, setMicEnabled] = useState(true)
  const [speakerEnabled, setSpeakerEnabled] = useState(true)
  const [activeSpeechWord, setActiveSpeechWord] = useState<string | null>(null)
  const { messages } = useChat()
  const { avatarType, avatarName, avatarVoice } = useAvatar()
  const { toast } = useToast()
  const { language, setLanguage } = useLanguage()
  const t = useTranslation()

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  // Calculate lesson progress based on messages
  useEffect(() => {
    if (messages.length > 5) {
      // Simple progress calculation based on conversation length
      const newProgress = Math.min(Math.floor(messages.length * 2.5), 100)
      setProgress(newProgress)
    }
  }, [messages])

  // Add this after the toggleSpeaker function
  const navigateToSpeechPractice = () => {
    // Use window.location for navigation
    window.location.href = "/speech-practice"
  }

  const toggleCollapsed = () => {
    setCollapsed(!collapsed)
  }

  const toggleMic = () => {
    setMicEnabled(!micEnabled)
  }

  const toggleSpeaker = () => {
    setSpeakerEnabled(!speakerEnabled)
    if (speakerEnabled) {
      stopSpeaking()
      setActiveSpeechWord(null)
    }
  }

  // Replace the handleLanguageChange function with this:
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
  }

  // Handle word pronunciation with better error handling
  const handleWordPronunciation = async (word: string) => {
    if (!speakerEnabled) {
      toast({
        title: t("settings.speaker"),
        description: "Enable the speaker to hear pronunciations",
        variant: "default",
      })
      return
    }

    try {
      // If already speaking the same word, stop it
      if (activeSpeechWord === word && isSpeechActive()) {
        stopSpeaking()
        setActiveSpeechWord(null)
        return
      }

      // Set active word immediately for UI feedback
      setActiveSpeechWord(word)

      // This will automatically stop any current speech
      // Use the selected avatar's voice (male or female)
      await speak(word, "en-US", avatarVoice)

      // Reset active word after a short delay
      setTimeout(() => {
        if (activeSpeechWord === word) {
          setActiveSpeechWord(null)
        }
      }, 1000)
    } catch (error) {
      console.error("Failed to pronounce word:", error)

      // Only show error for non-interruption errors
      if (error instanceof Error && !error.message.includes("interrupted")) {
        toast({
          title: "Pronunciation Error",
          description: "Failed to pronounce the word. Please try again.",
          variant: "destructive",
        })
      }

      // Reset active word state
      setActiveSpeechWord(null)
    }
  }

  // Sample lesson data
  const lessons = [
    { id: 1, title: t("lessons.greetings"), completed: true },
    { id: 2, title: t("lessons.dailyConversations"), completed: true },
    { id: 3, title: t("lessons.travelVocabulary"), completed: false, active: true },
    { id: 4, title: t("lessons.businessEnglish"), completed: false },
    { id: 5, title: t("lessons.academicWriting"), completed: false },
  ]

  // Sample saved vocabulary
  const savedVocabulary = [
    { word: "Eloquent", difficulty: 3 },
    { word: "Perseverance", difficulty: 3 },
    { word: "Collaborate", difficulty: 2 },
    { word: "Implement", difficulty: 2 },
    { word: "Fundamental", difficulty: 1 },
  ]

  // Sample conversation history
  const conversationHistory = [
    { id: 1, title: "Travel Planning", date: "Today", messages: 24 },
    { id: 2, title: "Job Interview Practice", date: "Yesterday", messages: 36 },
    { id: 3, title: "Restaurant Dialogue", date: "3 days ago", messages: 18 },
  ]

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case 2:
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case 3:
        return "bg-orange-100 text-orange-800 hover:bg-orange-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const isSmallScreen = () => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 640
    }
    return false
  }

  const getAvatarGradient = () => {
    return avatarType === "female" ? "from-indigo-500 to-purple-500" : "from-blue-500 to-cyan-500"
  }

  // Add this after the other useEffect hooks
  useEffect(() => {
    // Save active tab to localStorage when it changes
    if (typeof window !== "undefined") {
      localStorage.setItem("activeTab", activeTab)
    }
  }, [activeTab])

  // Add this after the other useEffect hooks
  useEffect(() => {
    // Restore active tab from localStorage on component mount
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("activeTab")
      if (savedTab) {
        setActiveTab(savedTab)
      }
    }
  }, [])

  // Add this code after the existing useEffect that loads the active tab:
  useEffect(() => {
    // Set active tab based on current URL path
    if (typeof window !== "undefined") {
      const path = window.location.pathname
      if (path.includes("speech-practice")) {
        setActiveTab("speech")
      }
    }
  }, [])

  // Add this after the other useEffect hooks
  useEffect(() => {
    const handleResize = () => {
      // If screen is very small and sidebar is expanded, collapse it
      if (window.innerWidth < 480 && !collapsed) {
        setCollapsed(true)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [collapsed])

  const renderTabContent = () => {
    switch (activeTab) {
      case "lessons":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">{t("progress.currentProgress")}</h3>
              <Badge variant="outline" className="font-medium">
                {t("progress.level")}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-500">
              {progress}% {t("progress.completed")}
            </p>

            <h3 className="font-semibold text-lg mt-6">{t("lessons.plan")}</h3>
            <div className="space-y-2">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    lesson.active
                      ? "border-indigo-300 bg-indigo-50"
                      : lesson.completed
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {lesson.completed ? (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-gray-300"></div>
                      )}
                      <span className={lesson.completed ? "text-gray-600" : "font-medium"}>{lesson.title}</span>
                    </div>
                    {lesson.active && <Badge className="bg-indigo-500">{t("lessons.current")}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case "vocabulary":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Saved Words</h3>
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                <BookMarked className="h-3.5 w-3.5 mr-1" />
                {t("vocabulary.export")}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {savedVocabulary.map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className={`rounded-full text-xs font-medium ${getDifficultyColor(item.difficulty)} ${
                    activeSpeechWord === item.word ? "ring-2 ring-indigo-400" : ""
                  }`}
                  onClick={() => handleWordPronunciation(item.word)}
                  disabled={!speakerEnabled}
                >
                  {item.word}
                  <Volume2
                    className={`h-3 w-3 ml-1 ${activeSpeechWord === item.word ? "animate-pulse" : "opacity-60"}`}
                  />
                </Button>
              ))}
            </div>

            <Separator className="my-4" />

            <div>
              <h3 className="font-semibold text-lg mb-2">{t("vocabulary.quiz")}</h3>
              <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                {t("vocabulary.quiz")}
              </Button>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">Difficulty Levels</h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>{t("vocabulary.difficulty.basic")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>{t("vocabulary.difficulty.intermediate")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>{t("vocabulary.difficulty.advanced")}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case "history":
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{t("nav.history")}</h3>
            <div className="space-y-3">
              {conversationHistory.map((convo) => (
                <div
                  key={convo.id}
                  className="p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between">
                    <h4 className="font-medium">{convo.title}</h4>
                    <span className="text-xs text-gray-500">{convo.date}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <MessageSquare className="h-3 w-3" />
                    <span>{convo.messages} messages</span>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div>
              <h3 className="font-semibold text-lg mb-2">Learning Analytics</h3>
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{t("progress.speakingTime")}</span>
                  <span className="text-sm text-gray-600">32 minutes</span>
                </div>
                <Progress value={64} className="h-1.5 mb-4" />

                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{t("progress.vocabularyUsed")}</span>
                  <span className="text-sm text-gray-600">187 words</span>
                </div>
                <Progress value={42} className="h-1.5 mb-4" />

                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{t("progress.grammarAccuracy")}</span>
                  <span className="text-sm text-gray-600">78%</span>
                </div>
                <Progress value={78} className="h-1.5" />
              </div>
            </div>
          </div>
        )

      case "settings":
        return (
          <div className="space-y-4 w-full">
            <h3 className="font-semibold text-lg">{t("settings.voiceAudio")}</h3>
            <div className="space-y-3 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  <span className="truncate">{t("settings.microphone")}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={micEnabled ? "bg-indigo-100 text-indigo-700 ml-2" : "ml-2"}
                  onClick={toggleMic}
                >
                  {micEnabled ? t("settings.enabled") : t("settings.disabled")}
                </Button>
              </div>

              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  <span className="truncate">{t("settings.speaker")}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={speakerEnabled ? "bg-indigo-100 text-indigo-700 ml-2" : "ml-2"}
                  onClick={toggleSpeaker}
                >
                  {speakerEnabled ? t("settings.enabled") : t("settings.disabled")}
                </Button>
              </div>
            </div>

            <Separator className="my-4" />

            <h3 className="font-semibold text-lg">{t("settings.display")}</h3>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button variant="outline" size="sm" className="justify-start overflow-hidden">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1 flex-shrink-0"
                >
                  <circle cx="12" cy="12" r="4"></circle>
                  <path d="M12 2v2"></path>
                  <path d="M12 20v2"></path>
                  <path d="m4.93 4.93 1.41 1.41"></path>
                  <path d="m17.66 17.66 1.41 1.41"></path>
                  <path d="M2 12h2"></path>
                  <path d="M20 12h2"></path>
                  <path d="m6.34 17.66-1.41 1.41"></path>
                  <path d="m19.07 4.93-1.41 1.41"></path>
                </svg>
                <span className="truncate">{t("settings.light")}</span>
              </Button>
              <Button variant="outline" size="sm" className="justify-start bg-gray-100 overflow-hidden">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1 flex-shrink-0"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                </svg>
                <span className="truncate">{t("settings.dark")}</span>
              </Button>
            </div>

            <Separator className="my-4" />

            <h3 className="font-semibold text-lg">{t("settings.language")}</h3>
            <div className="w-full">
              <LanguageSwitcher variant="sidebar" />
            </div>

            <h3 className="font-semibold text-lg mt-4">{t("settings.environment")}</h3>
            <div className="w-full">
              <EnvironmentSelector />
            </div>
          </div>
        )

      case "speech":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">{t("speech.title")}</h3>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={navigateToSpeechPractice}>
                {t("speech.practice")}
              </Button>
            </div>

            <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="h-4 w-4 text-indigo-600" />
                <p className="font-medium text-indigo-700">{t("speech.feedback")}</p>
              </div>
              <p className="text-sm text-indigo-600">{t("speech.feedbackDesc")}</p>
            </div>

            <div className="p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-gray-600" />
                <p className="font-medium">{t("speech.recentPractice")}</p>
              </div>
              <div className="text-sm text-gray-500">
                <p>• Daily conversation practice</p>
                <p>• Travel vocabulary</p>
                <p>• Past tense practice</p>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">{t("speech.practiceModes")}</h3>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="justify-start text-left">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{t("speech.freePractice")}</span>
                    <span className="text-xs text-gray-500">{t("speech.freeDesc")}</span>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start text-left">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{t("speech.guidedPractice")}</span>
                    <span className="text-xs text-gray-500">{t("speech.guidedDesc")}</span>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start text-left">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{t("speech.conversation")}</span>
                    <span className="text-xs text-gray-500">{t("speech.conversationDesc")}</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="relative h-full">
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full bg-white border-r border-gray-200 shadow-sm overflow-hidden max-w-[400px] w-full"
          >
            <div className="flex flex-col h-full">
              {/* User profile section */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-r ${getAvatarGradient()} flex items-center justify-center text-white font-bold`}
                  >
                    S
                  </div>
                  <div>
                    <h2 className="font-semibold">{t("profile.student")}</h2>
                    <p className="text-xs text-gray-500">
                      {t("profile.learningWith")} {avatarName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation tabs - Fixed layout with icons and text */}
              <div className="border-b border-gray-200">
                <div className="grid grid-cols-5 w-full">
                  <button
                    className={`py-3 px-1 text-sm font-medium flex flex-col items-center justify-center ${
                      activeTab === "lessons"
                        ? "text-indigo-600 border-b-2 border-indigo-600"
                        : "text-gray-600 hover:text-indigo-600"
                    }`}
                    onClick={() => setActiveTab("lessons")}
                  >
                    <GraduationCap className="h-5 w-5 mb-1" />
                    <span className="text-xs truncate w-full text-center">{t("nav.lessons")}</span>
                  </button>
                  <button
                    className={`py-3 px-1 text-sm font-medium flex flex-col items-center justify-center ${
                      activeTab === "speech"
                        ? "text-indigo-600 border-b-2 border-indigo-600"
                        : "text-gray-600 hover:text-indigo-600"
                    }`}
                    onClick={() => setActiveTab("speech")}
                  >
                    <Headphones className="h-5 w-5 mb-1" />
                    <span className="text-xs truncate w-full text-center">{t("nav.speaking")}</span>
                  </button>
                  <button
                    className={`py-3 px-1 text-sm font-medium flex flex-col items-center justify-center ${
                      activeTab === "vocabulary"
                        ? "text-indigo-600 border-b-2 border-indigo-600"
                        : "text-gray-600 hover:text-indigo-600"
                    }`}
                    onClick={() => setActiveTab("vocabulary")}
                  >
                    <BookOpen className="h-5 w-5 mb-1" />
                    <span className="text-xs truncate w-full text-center">{t("nav.vocabulary")}</span>
                  </button>
                  <button
                    className={`py-3 px-1 text-sm font-medium flex flex-col items-center justify-center ${
                      activeTab === "history"
                        ? "text-indigo-600 border-b-2 border-indigo-600"
                        : "text-gray-600 hover:text-indigo-600"
                    }`}
                    onClick={() => setActiveTab("history")}
                  >
                    <History className="h-5 w-5 mb-1" />
                    <span className="text-xs truncate w-full text-center">{t("nav.history")}</span>
                  </button>
                  <button
                    className={`py-3 px-1 text-sm font-medium flex flex-col items-center justify-center ${
                      activeTab === "settings"
                        ? "text-indigo-600 border-b-2 border-indigo-600"
                        : "text-gray-600 hover:text-indigo-600"
                    }`}
                    onClick={() => setActiveTab("settings")}
                  >
                    <Settings className="h-5 w-5 mb-1" />
                    <span className="text-xs truncate w-full text-center">{t("nav.settings")}</span>
                  </button>
                </div>
              </div>

              {/* Content area */}
              <ScrollArea className="flex-1 p-4 w-full">
                <div className="w-full">{renderTabContent()}</div>
              </ScrollArea>

              {/* Quick controls */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    size="icon"
                    className={`rounded-full ${micEnabled ? "bg-indigo-100 text-indigo-700" : ""}`}
                    onClick={toggleMic}
                  >
                    {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`rounded-full ${speakerEnabled ? "bg-indigo-100 text-indigo-700" : ""}`}
                    onClick={toggleSpeaker}
                  >
                    {speakerEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SidebarButton collapsed={collapsed} toggleCollapsed={toggleCollapsed} />
    </div>
  )
}
