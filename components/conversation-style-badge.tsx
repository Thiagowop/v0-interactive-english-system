"use client"

import { useEnvironment } from "@/contexts/environment-context"
import { Badge } from "@/components/ui/badge"
import { Coffee, Briefcase, GraduationCap, Plane, MessageCircle } from "lucide-react"

export function ConversationStyleBadge() {
  const { environment } = useEnvironment()

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "coffee":
        return <Coffee className="h-3 w-3 mr-1" />
      case "briefcase":
        return <Briefcase className="h-3 w-3 mr-1" />
      case "graduation-cap":
        return <GraduationCap className="h-3 w-3 mr-1" />
      case "plane":
        return <Plane className="h-3 w-3 mr-1" />
      case "message-circle":
        return <MessageCircle className="h-3 w-3 mr-1" />
      default:
        return <Coffee className="h-3 w-3 mr-1" />
    }
  }

  const getStyleColor = (id: string) => {
    switch (id) {
      case "casual":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "business":
        return "bg-gray-50 text-gray-700 border-gray-200"
      case "academic":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "travel":
        return "bg-green-50 text-green-700 border-green-200"
      case "slang":
        return "bg-pink-50 text-pink-700 border-pink-200"
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200"
    }
  }

  return (
    <Badge variant="outline" className={`flex items-center ${getStyleColor(environment.id)}`}>
      {getIcon(environment.icon)}
      {environment.name.split(" ")[0]}
    </Badge>
  )
}
