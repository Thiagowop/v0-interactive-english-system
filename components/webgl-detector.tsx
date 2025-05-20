"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { checkWebGLSupport } from "@/lib/model-loader"

export default function WebGLDetector() {
  const [webGLStatus, setWebGLStatus] = useState<{ supported: boolean; message: string } | null>(null)

  useEffect(() => {
    // Only run on client-side
    if (typeof window !== "undefined") {
      const status = checkWebGLSupport()
      setWebGLStatus(status)
    }
  }, [])

  // Don't show anything if WebGL is supported or we're still checking
  if (!webGLStatus || webGLStatus.supported) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>WebGL Not Available</AlertTitle>
      <AlertDescription>
        {webGLStatus.message} The 3D teacher avatar will be replaced with a simplified version.
      </AlertDescription>
    </Alert>
  )
}
