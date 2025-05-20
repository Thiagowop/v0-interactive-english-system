"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type AvatarType = "female" | "male"

type AvatarContextType = {
  avatarType: AvatarType
  setAvatarType: (type: AvatarType) => void
  avatarName: string
  avatarVoice: string
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined)

export function AvatarProvider({ children }: { children: ReactNode }) {
  const [avatarType, setAvatarType] = useState<AvatarType>("female")

  // Derived values based on avatar type
  const avatarName = avatarType === "female" ? "Ms. Emily" : "Mr. Alan"
  // Explicitly set "male" or "female" string for voice selection
  const avatarVoice = avatarType === "female" ? "female" : "male"

  return (
    <AvatarContext.Provider value={{ avatarType, setAvatarType, avatarName, avatarVoice }}>
      {children}
    </AvatarContext.Provider>
  )
}

export function useAvatar() {
  const context = useContext(AvatarContext)
  if (context === undefined) {
    throw new Error("useAvatar must be used within an AvatarProvider")
  }
  return context
}
