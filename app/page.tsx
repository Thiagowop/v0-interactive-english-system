"use client"
import ChatInterface from "@/components/chat-interface"
import LanguageSwitcher from "@/components/language-switcher"
import TeacherAvatar2D from "@/components/teacher-avatar-2d"
import AvatarSelector from "@/components/avatar-selector"
import Sidebar from "@/components/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ChatProvider, useChat } from "@/contexts/chat-context"
import { AvatarProvider } from "@/contexts/avatar-context"
import { speak } from "@/lib/simple-tts"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Headphones, Maximize } from "lucide-react"
import { useLanguage, useTranslation } from "@/components/language-context"
import ExpandedChat from "@/components/expanded-chat"

function WordCard({ word, difficulty }: { word: string; difficulty: number }) {
  const { speechLanguage } = useLanguage()

  const difficultyClasses = {
    1: "bg-green-50 hover:bg-green-100 text-green-700 border-green-200",
    2: "bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200",
    3: "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200",
  }

  const handleClick = async () => {
    try {
      speak(word, speechLanguage)
    } catch (error) {
      console.error(`Failed to pronounce ${word}:`, error)
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-4 py-2 rounded-full transition-colors border ${
        difficultyClasses[difficulty as 1 | 2 | 3]
      } font-medium`}
      onClick={handleClick}
    >
      {word}
    </motion.button>
  )
}

function VocabularyExplorer() {
  const { extractedVocabulary, updateExtractedVocabulary, messages } = useChat()
  const t = useTranslation()

  // Update vocabulary when messages change
  useEffect(() => {
    if (messages.length > 0) {
      updateExtractedVocabulary()
    }
  }, [messages, updateExtractedVocabulary])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="w-full"
    >
      <Card className="border border-indigo-100 shadow-md rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
              {t("vocabulary.title")}
            </h2>
            <button
              onClick={updateExtractedVocabulary}
              className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-full transition-colors"
            >
              {t("vocabulary.refresh")}
            </button>
          </div>
          <p className="text-gray-600 mb-6">
            {t("vocabulary.description")}
            <span className="ml-2 bg-yellow-100 px-2 py-1 rounded-full text-yellow-800 text-sm font-medium">
              {t("vocabulary.highlighted")}
            </span>{" "}
            {t("vocabulary.difficult")}
          </p>
          {extractedVocabulary.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {extractedVocabulary.map((item, index) => (
                <WordCard key={`${item.word}-${index}`} word={item.word} difficulty={item.difficulty} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>{t("vocabulary.empty")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function HomeContent() {
  const t = useTranslation()
  const [isExpandedChatOpen, setIsExpandedChatOpen] = useState(false)

  return (
    <main className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mt-8"
          >
            <h1 className="text-3xl md:text-5xl font-bold text-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
              {t("app.title")}
            </h1>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">{t("app.description")}</p>
          </motion.div>

          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Teacher Avatar Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg p-6 h-[400px] md:h-[500px] overflow-hidden border border-indigo-100"
            >
              <TeacherAvatar2D />
            </motion.div>

            {/* Chat Interface Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col bg-white rounded-2xl shadow-lg p-6 h-[400px] md:h-[500px] border border-indigo-100"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-indigo-700">Chat</h2>
                  <AvatarSelector />
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/speech-practice">
                    <Button variant="outline" size="sm" className="bg-indigo-50 text-indigo-700 border-indigo-200 h-8">
                      <Headphones className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">{t("nav.speaking")}</span>
                    </Button>
                  </Link>
                  <LanguageSwitcher variant="dropdown" />
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-indigo-50 text-indigo-700 border-indigo-200 h-8 w-8 rounded-full"
                    onClick={() => setIsExpandedChatOpen(true)}
                    aria-label="Expand chat to full screen"
                    title="Expand chat to full screen"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <ChatInterface />
            </motion.div>
          </div>

          {/* Vocabulary Explorer Section */}
          <VocabularyExplorer />
        </div>
      </div>
      {/* Expanded Chat Modal */}
      <ExpandedChat isOpen={isExpandedChatOpen} onClose={() => setIsExpandedChatOpen(false)} />
    </main>
  )
}

export default function Home() {
  return (
    <AvatarProvider>
      <ChatProvider>
        <HomeContent />
      </ChatProvider>
    </AvatarProvider>
  )
}
