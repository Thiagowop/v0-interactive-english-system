"use client"
import { useEnvironment } from "@/contexts/environment-context"
import { Card } from "@/components/ui/card"
import { Coffee, Briefcase, GraduationCap, Plane, MessageCircle, Check } from "lucide-react"

export function ConversationStyleSelector() {
  const { environment, setEnvironment, environments } = useEnvironment()

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "coffee":
        return <Coffee className="h-5 w-5" />
      case "briefcase":
        return <Briefcase className="h-5 w-5" />
      case "graduation-cap":
        return <GraduationCap className="h-5 w-5" />
      case "plane":
        return <Plane className="h-5 w-5" />
      case "message-circle":
        return <MessageCircle className="h-5 w-5" />
      default:
        return <Coffee className="h-5 w-5" />
    }
  }

  const getStyleColor = (id: string) => {
    switch (id) {
      case "casual":
        return "border-blue-200 hover:border-blue-300 hover:bg-blue-50"
      case "business":
        return "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      case "academic":
        return "border-purple-200 hover:border-purple-300 hover:bg-purple-50"
      case "travel":
        return "border-green-200 hover:border-green-300 hover:bg-green-50"
      case "slang":
        return "border-pink-200 hover:border-pink-300 hover:bg-pink-50"
      default:
        return "border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50"
    }
  }

  const getActiveStyleColor = (id: string) => {
    switch (id) {
      case "casual":
        return "border-blue-500 bg-blue-50"
      case "business":
        return "border-gray-500 bg-gray-50"
      case "academic":
        return "border-purple-500 bg-purple-50"
      case "travel":
        return "border-green-500 bg-green-50"
      case "slang":
        return "border-pink-500 bg-pink-50"
      default:
        return "border-indigo-500 bg-indigo-50"
    }
  }

  return (
    <div className="w-full mb-4">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-indigo-700">Conversation Style</h3>
        <p className="text-xs text-gray-500">Choose how the AI should respond to you</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {environments.map((env) => (
          <Card
            key={env.id}
            className={`border p-3 cursor-pointer transition-all ${
              environment.id === env.id ? getActiveStyleColor(env.id) : getStyleColor(env.id)
            }`}
            onClick={() => setEnvironment(env)}
          >
            <div className="flex items-center">
              <div className={`mr-3 ${environment.id === env.id ? "text-indigo-600" : "text-gray-500"}`}>
                {getIcon(env.icon)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{env.name}</div>
                <div className="text-xs text-gray-500 truncate">{env.description}</div>
              </div>
              {environment.id === env.id && <Check className="h-4 w-4 text-indigo-600" />}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
