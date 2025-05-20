"use client"
import { useEnvironment } from "@/contexts/environment-context"
import { Button } from "@/components/ui/button"
import { Coffee, Briefcase, GraduationCap, Plane, MessageCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function CompactStyleSelector() {
  const { environment, setEnvironment, environments } = useEnvironment()

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

  const getStyleColor = (id: string) => {
    switch (id) {
      case "casual":
        return "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
      case "business":
        return "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
      case "academic":
        return "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
      case "travel":
        return "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
      case "slang":
        return "border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100"
      default:
        return "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
    }
  }

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="w-full mb-1">
          <p className="text-sm font-medium text-gray-700">Conversation Style:</p>
        </div>
        {environments.map((env) => (
          <Tooltip key={env.id}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`${
                  environment.id === env.id ? `${getStyleColor(env.id)} border-2` : "bg-white hover:bg-gray-50"
                } transition-all`}
                onClick={() => setEnvironment(env)}
              >
                <span className="mr-1.5">{getIcon(env.icon)}</span>
                {env.name.split(" ")[0]}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="font-medium">{env.name}</p>
              <p className="text-xs text-gray-500">{env.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
