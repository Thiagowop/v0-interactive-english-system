"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "./language-context"
import { motion } from "framer-motion"
import { Globe } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import LanguageModal from "./language-modal"

interface LanguageSwitcherProps {
  variant?: "default" | "minimal" | "compact" | "dropdown" | "global" | "sidebar"
  className?: string
  align?: "left" | "center" | "right"
}

export default function LanguageSwitcher({
  variant = "default",
  className = "",
  align = "right",
}: LanguageSwitcherProps) {
  const { language, setLanguage, availableLanguages } = useLanguage()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }

  const currentLang = availableLanguages.find((lang) => lang.code === language) || availableLanguages[0]

  if (variant === "global") {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg bg-white border-indigo-200 hover:bg-indigo-50"
        >
          <Globe className="h-4 w-4 mr-2" />
          {currentLang.name}
        </Button>
        <LanguageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    )
  }

  if (variant === "sidebar") {
    return (
      <div className="flex flex-col space-y-2 w-full">
        {availableLanguages.map((lang) => (
          <Button
            key={lang.code}
            variant={language === lang.code ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => setLanguage(lang.code)}
          >
            <span className="mr-2">{lang.flag}</span>
            <span className="truncate">{lang.name}</span>
          </Button>
        ))}
      </div>
    )
  }

  if (variant === "dropdown") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-2 gap-1 bg-white">
              <span className="mr-1">{currentLang.flag}</span>
              <Globe className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[140px]">
            {availableLanguages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                className="cursor-pointer flex items-center gap-2"
                onClick={() => setLanguage(lang.code)}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              className="cursor-pointer flex items-center gap-2 border-t mt-1 pt-1"
              onClick={() => setIsModalOpen(true)}
            >
              <Globe className="h-4 w-4" />
              <span>More languages</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <LanguageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    )
  }

  if (variant === "minimal") {
    return (
      <>
        <div className={`flex gap-2 ${alignmentClasses[align]} ${className}`}>
          {availableLanguages.slice(0, 2).map((lang) => (
            <motion.button
              key={lang.code}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                language === lang.code
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  : "bg-gray-50 text-gray-500 border border-gray-200"
              }`}
              onClick={() => setLanguage(lang.code)}
              aria-label={`Switch to ${lang.name}`}
            >
              <span>{lang.flag}</span>
            </motion.button>
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-500 border border-gray-200"
            onClick={() => setIsModalOpen(true)}
            aria-label="More languages"
          >
            <Globe className="h-4 w-4" />
          </motion.button>
        </div>
        <LanguageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    )
  }

  if (variant === "compact") {
    return (
      <>
        <div className={`inline-flex ${className}`}>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full flex items-center gap-1 px-3 py-1 h-8 bg-white min-w-[120px]"
            onClick={() => setIsModalOpen(true)}
          >
            <Globe className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span className="truncate">{currentLang.name}</span>
          </Button>
        </div>
        <LanguageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    )
  }

  return (
    <>
      <div className={`flex gap-2 ${alignmentClasses[align]} ${className}`}>
        {availableLanguages.slice(0, 3).map((lang) => (
          <Button
            key={lang.code}
            variant="outline"
            size="sm"
            className={`justify-start ${language === lang.code ? "bg-indigo-100 text-indigo-700 border-indigo-200" : ""}`}
            onClick={() => setLanguage(lang.code)}
          >
            <span className="mr-1">{lang.flag}</span>
            {lang.name}
          </Button>
        ))}
        <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
          <Globe className="h-4 w-4 mr-1" />
          More
        </Button>
      </div>
      <LanguageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
