"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useLanguage } from "./language-context"
import { motion } from "framer-motion"
import { Check } from "lucide-react"

interface LanguageModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LanguageModal({ isOpen, onClose }: LanguageModalProps) {
  const { language, setLanguage, availableLanguages, translations } = useLanguage()
  const [selectedLanguage, setSelectedLanguage] = useState<string>(language)

  // Reset selected language when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedLanguage(language)
    }
  }, [isOpen, language])

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value)
  }

  const handleApply = () => {
    setLanguage(selectedLanguage)
    onClose()
  }

  const getTranslation = (key: string) => {
    return translations[key] || key
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md"
        description={getTranslation("modal.selectLanguage") + " - " + getTranslation("language.select")}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            {getTranslation("modal.selectLanguage")}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-500">
            {getTranslation("language.change")}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={selectedLanguage} onValueChange={handleLanguageChange} className="space-y-4">
            {availableLanguages.map((lang) => (
              <div
                key={lang.code}
                className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                  selectedLanguage === lang.code
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                }`}
              >
                <RadioGroupItem value={lang.code} id={lang.code} className="sr-only" />
                <Label
                  htmlFor={lang.code}
                  className="flex flex-1 cursor-pointer items-center justify-between text-sm font-medium"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{lang.flag}</div>
                    <div>
                      <div className="font-semibold">{lang.nativeName}</div>
                      <div className="text-xs text-gray-500">{lang.name}</div>
                    </div>
                  </div>
                  {selectedLanguage === lang.code && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="rounded-full bg-indigo-500 p-1 text-white"
                    >
                      <Check className="h-4 w-4" />
                    </motion.div>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            {getTranslation("button.cancel")}
          </Button>
          <Button onClick={handleApply} className="bg-indigo-600 hover:bg-indigo-700">
            {getTranslation("modal.applyChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
