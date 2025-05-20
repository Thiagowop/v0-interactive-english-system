"use client"

import { Button } from "@/components/ui/button"
import { useAvatar } from "@/contexts/avatar-context"
import { motion } from "framer-motion"
import { User, Users } from "lucide-react"

export default function AvatarSelector() {
  const { avatarType, setAvatarType } = useAvatar()

  return (
    <div className="flex items-center gap-2 bg-white rounded-full p-1 border border-indigo-200 shadow-sm">
      <motion.div
        whileHover={{ scale: avatarType === "female" ? 1 : 1.05 }}
        whileTap={{ scale: avatarType === "female" ? 1 : 0.95 }}
      >
        <Button
          variant={avatarType === "female" ? "default" : "ghost"}
          size="sm"
          className={`rounded-full ${
            avatarType === "female"
              ? "bg-gradient-to-r from-indigo-500 to-purple-500"
              : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
          }`}
          onClick={() => setAvatarType("female")}
        >
          <User className="h-4 w-4 mr-1" />
          Ms. Emily
        </Button>
      </motion.div>

      <motion.div
        whileHover={{ scale: avatarType === "male" ? 1 : 1.05 }}
        whileTap={{ scale: avatarType === "male" ? 1 : 0.95 }}
      >
        <Button
          variant={avatarType === "male" ? "default" : "ghost"}
          size="sm"
          className={`rounded-full ${
            avatarType === "male"
              ? "bg-gradient-to-r from-blue-500 to-cyan-500"
              : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
          }`}
          onClick={() => setAvatarType("male")}
        >
          <Users className="h-4 w-4 mr-1" />
          Mr. Alan
        </Button>
      </motion.div>
    </div>
  )
}
