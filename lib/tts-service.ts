// This service handles text-to-speech using Coqui TTS

// Function to check if browser TTS is available
export function isBrowserTTSAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window
}

// Enhanced function to generate speech with better error handling
export async function generateSpeech(text: string, language = "en"): Promise<ArrayBuffer> {
  try {
    // Try direct connection to Coqui server
    const response = await fetch("http://localhost:5002/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        speaker_id: null,
        style_wav: null,
        language_id: language === "en" ? 0 : 1,
      }),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    if (!response.ok) {
      throw new Error(`TTS request failed with status ${response.status}`)
    }

    return await response.arrayBuffer()
  } catch (directError) {
    console.warn("Direct connection to Coqui failed, trying proxy:", directError)

    try {
      // Try through our proxy API route
      const proxyResponse = await fetch("/api/coqui-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          language_id: language === "en" ? 0 : 1,
        }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      if (!proxyResponse.ok) {
        throw new Error(`Proxy TTS request failed with status ${proxyResponse.status}`)
      }

      return await proxyResponse.arrayBuffer()
    } catch (proxyError) {
      console.error("Both direct and proxy TTS requests failed:", proxyError)
      throw new Error("Failed to generate speech through any available method")
    }
  }
}

// Function to play audio from ArrayBuffer
export function playAudio(audioData: ArrayBuffer): void {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()

  audioContext.decodeAudioData(
    audioData,
    (buffer) => {
      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(audioContext.destination)
      source.start(0)
    },
    (err) => {
      console.error("Error decoding audio data", err)
    },
  )
}

// Function to pronounce a word using Coqui TTS
export async function pronounceWord(word: string, language = "en"): Promise<void> {
  try {
    // First check if Coqui is available
    const coquiAvailable = await isCoquiAvailable()

    if (coquiAvailable) {
      const audioData = await generateSpeech(word, language)
      playAudio(audioData)
    } else {
      // Fallback to browser TTS
      if (isBrowserTTSAvailable()) {
        const utterance = new SpeechSynthesisUtterance(word)
        utterance.lang = language === "en" ? "en-US" : "pt-BR"
        window.speechSynthesis.speak(utterance)
      } else {
        console.error("No TTS system available")
        throw new Error("No TTS system available")
      }
    }
  } catch (error) {
    console.error("Error pronouncing word:", error)

    // Double-check fallback is available
    if (isBrowserTTSAvailable()) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = language === "en" ? "en-US" : "pt-BR"
      window.speechSynthesis.speak(utterance)
    }
  }
}

// Function to check if Coqui TTS server is available with better error handling
export async function isCoquiAvailable(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false // Not available during SSR
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const response = await fetch("http://localhost:5002/api/version", {
      method: "GET",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    console.warn("Coqui TTS server not available, falling back to browser TTS")
    return false
  }
}
