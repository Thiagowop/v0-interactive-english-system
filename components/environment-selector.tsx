"use client"

import { useState } from "react"
import { useEnvironment } from "@/contexts/environment-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTranslation } from "@/components/language-context"
import { Coffee, Briefcase, GraduationCap, Plane, MessageCircle, Check } from "lucide-react"

export default function EnvironmentSelector() {
  const { environment, setEnvironment, environments } = useEnvironment()
  const t = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "coffee":
        return <Coffee className="h-4 w-4" />
      case "briefcase":
        return <Briefcase className="h-4 w-4" />
      case "graduation-cap":
        return <GraduationCap className="h-4 w-4" />
      case "plane":
        return <Plane className="h-4 w-4" />
      case "message-circle":
        return <MessageCircle className="h-4 w-4" />
      default:
        return <Coffee className="h-4 w-4" />
    }
  }

  return (
    <div className="w-full">
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-700">{t("environment.title")}</h3>
        <p className="text-xs text-gray-500">{t("environment.description")}</p>
      </div>

      <Button variant="outline" className="w-full justify-between" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center">
          {getIcon(environment.icon)}
          <span className="ml-2">{environment.name}</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </Button>

      {isOpen && (
        <div className="relative mt-1 w-full z-10">
          <div className="absolute w-full bg-white border border-gray-200 rounded-md shadow-lg">
            <ScrollArea className="max-h-60">
              <div className="p-1">
                {environments.map((env) => (
                  <Button
                    key={env.id}
                    variant="ghost"
                    className={`w-full justify-start mb-1 ${
                      environment.id === env.id ? "bg-indigo-50 text-indigo-600" : ""
                    }`}
                    onClick={() => {
                      setEnvironment(env)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-center w-full">
                      <div className="mr-2">{getIcon(env.icon)}</div>
                      <div className="flex-1">
                        <div className="font-medium">{env.name}</div>
                        <div className="text-xs text-gray-500 truncate">{env.description}</div>
                      </div>
                      {environment.id === env.id && <Check className="h-4 w-4 ml-2" />}
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  )
}
