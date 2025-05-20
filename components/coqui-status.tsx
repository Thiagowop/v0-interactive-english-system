"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { isCoquiAvailable } from "@/lib/tts-service"

export default function CoquiStatus() {
  const [status, setStatus] = useState<"checking" | "available" | "unavailable">("checking")

  useEffect(() => {
    const checkCoquiStatus = async () => {
      try {
        const available = await isCoquiAvailable()
        setStatus(available ? "available" : "unavailable")
      } catch (error) {
        setStatus("unavailable")
      }
    }

    checkCoquiStatus()
  }, [])

  if (status === "checking") {
    return null
  }

  return (
    <Alert variant={status === "available" ? "default" : "destructive"} className="mb-4">
      {status === "available" ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Coqui TTS Connected</AlertTitle>
          <AlertDescription>Text-to-speech is using Coqui TTS for high-quality voice synthesis.</AlertDescription>
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Coqui TTS Unavailable</AlertTitle>
          <AlertDescription>
            Could not connect to Coqui TTS server. Falling back to browser's built-in speech synthesis. Make sure your
            Coqui TTS server is running on http://localhost:5002.
          </AlertDescription>
        </>
      )}
    </Alert>
  )
}
