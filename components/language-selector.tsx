"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, Check } from "lucide-react"
import { motion } from "framer-motion"

type Language = {
  code: string
  name: string
  nativeName: string
  flag: string
}

const languages: Language[] = [
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
]

export default function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          >
            <span className="mr-1">{selectedLanguage.flag}</span>
            <Globe className="h-4 w-4" />
            {selectedLanguage.nativeName}
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl border-indigo-100 shadow-lg">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setSelectedLanguage(language)}
            className="cursor-pointer rounded-lg focus:bg-indigo-50 focus:text-indigo-700"
          >
            <div className="flex items-center w-full">
              <span className="mr-2 text-lg">{language.flag}</span>
              <span>
                {language.name} <span className="text-gray-500">({language.nativeName})</span>
              </span>
              {selectedLanguage.code === language.code && <Check className="ml-auto h-4 w-4 text-indigo-600" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
