// Simple TTS service using browser's built-in speech synthesis

let currentUtterance: SpeechSynthesisUtterance | null = null
let isSpeaking = false
const speakQueue: Array<{ text: string; lang: string; voice?: string }> = []
let isProcessingQueue = false

// Map of voice names to their corresponding voice objects
const voiceMap = new Map<string, SpeechSynthesisVoice>()

// Initialize voice map
function initVoiceMap() {
  if (typeof window === "undefined" || !window.speechSynthesis) return

  const voices = window.speechSynthesis.getVoices()
  voices.forEach((voice) => {
    voiceMap.set(voice.name.toLowerCase(), voice)
  })
}

// Try to initialize voices immediately
if (typeof window !== "undefined" && window.speechSynthesis) {
  initVoiceMap()

  // Also set up the voiceschanged event to update our map when voices are loaded
  window.speechSynthesis.onvoiceschanged = () => {
    initVoiceMap()
  }
}

// Get the best matching voice for a language and voice preference
function getBestVoice(lang: string, voicePreference?: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null

  // Force refresh voices to ensure we have the latest list
  const voices = window.speechSynthesis.getVoices()

  // If we have a specific voice preference and it exists, use it
  if (voicePreference && voiceMap.has(voicePreference.toLowerCase())) {
    return voiceMap.get(voicePreference.toLowerCase()) || null
  }

  // Otherwise, find the best voice for the language
  // First try to find a voice that matches the language exactly
  const exactMatch = voices.find((voice) => voice.lang === lang)
  if (exactMatch) return exactMatch

  // If no exact match, try to find a voice that starts with the language code
  const langPrefix = lang.split("-")[0]
  const prefixMatch = voices.find((voice) => voice.lang.startsWith(langPrefix))
  if (prefixMatch) return prefixMatch

  // If still no match, use the default voice
  return voices.length > 0 ? voices[0] : null
}

// Process the speech queue
async function processQueue() {
  if (isProcessingQueue || speakQueue.length === 0) return

  isProcessingQueue = true

  while (speakQueue.length > 0) {
    const item = speakQueue[0]
    try {
      // Add a check for empty text
      if (!item.text || item.text.trim() === "") {
        console.warn("Empty text in speech queue, skipping")
        speakQueue.shift()
        continue
      }

      await speakItem(item.text, item.lang, item.voice)
    } catch (error) {
      console.error("Error in speech queue processing:", error)
    }
    speakQueue.shift() // Remove the processed item
  }

  isProcessingQueue = false
}

// Clean text to remove or replace problematic symbols
function cleanTextForSpeech(text: string): string {
  // Replace common symbols that might be read out loud
  return text
    .replace(/[*_~`]/g, "") // Remove markdown formatting characters
    .replace(/&/g, " and ") // Replace & with "and"
    .replace(/\+/g, " plus ") // Replace + with "plus"
    .replace(/%/g, " percent ") // Replace % with "percent"
    .replace(/=/g, " equals ") // Replace = with "equals"
    .replace(/\$/g, " dollar ") // Replace $ with "dollar"
    .replace(/€/g, " euro ") // Replace € with "euro"
    .replace(/£/g, " pound ") // Replace £ with "pound"
    .replace(/¥/g, " yen ") // Replace ¥ with "yen"
    .replace(/\^/g, "") // Remove ^ character
    .replace(/\|/g, "") // Remove | character
    .replace(/\\/g, "") // Remove \ character
    .replace(/\//g, " slash ") // Replace / with "slash"
    .replace(/</g, " less than ") // Replace < with "less than"
    .replace(/>/g, " greater than ") // Replace > with "greater than"
    .replace(/\[\]/g, "") // Remove empty brackets
    .replace(/$$$$/g, "") // Remove empty parentheses
    .replace(/\{\}/g, "") // Remove empty braces
    .replace(/\b[A-Z]{2,}\b/g, (match) => match.split("").join(" ")) // Space out acronyms
    .replace(/(\d+)\.(\d+)/g, "$1 point $2") // Replace decimal points with "point"
    .replace(/(\d)([,.])(\d{3})/g, "$1$3") // Remove thousands separators
    .replace(/\s+/g, " ") // Replace multiple spaces with a single space
    .trim() // Trim leading and trailing whitespace
}

// Split text into manageable chunks to avoid browser limitations
function splitTextIntoChunks(text: string, maxLength = 200): string[] {
  if (text.length <= maxLength) return [text]

  const chunks: string[] = []
  let currentChunk = ""

  // Split by sentences first
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]

  for (const sentence of sentences) {
    // If a single sentence is too long, split it further
    if (sentence.length > maxLength) {
      // Split by commas or other natural pauses
      const parts = sentence.split(/([,;:]\s+)/)
      let buffer = ""

      for (const part of parts) {
        if (buffer.length + part.length <= maxLength) {
          buffer += part
        } else {
          if (buffer) chunks.push(buffer)
          buffer = part
        }
      }

      if (buffer) chunks.push(buffer)
    } else {
      // Check if adding this sentence would exceed the limit
      if (currentChunk.length + sentence.length <= maxLength) {
        currentChunk += sentence
      } else {
        if (currentChunk) chunks.push(currentChunk)
        currentChunk = sentence
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk)
  return chunks
}

// Add this function before the speakItem function
function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.speechSynthesis !== undefined &&
    typeof SpeechSynthesisUtterance !== "undefined"
  )
}

// Speak a single item
function speakItem(text: string, lang: string, voicePreference?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisSupported()) {
      console.warn("Speech synthesis not supported in this browser")
      resolve() // Resolve instead of reject to allow the app to continue
      return
    }

    if (!text || text.trim() === "") {
      console.warn("Empty text provided to speak function")
      resolve()
      return
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      // Add a small delay to ensure the previous speech is fully canceled
      setTimeout(() => {
        try {
          // Clean the text to handle symbols properly
          const cleanedText = cleanTextForSpeech(text)
          if (!cleanedText) {
            console.warn("Empty text after cleaning, skipping speech")
            resolve()
            return
          }

          // Split text into manageable chunks
          const textChunks = splitTextIntoChunks(cleanedText)
          let chunkIndex = 0

          const speakNextChunk = () => {
            if (chunkIndex >= textChunks.length) {
              isSpeaking = false
              currentUtterance = null
              resolve()
              return
            }

            const chunk = textChunks[chunkIndex++]
            console.log(`Speaking chunk ${chunkIndex}/${textChunks.length}: "${chunk}"`)

            // Create a new utterance for this chunk
            const utterance = new SpeechSynthesisUtterance(chunk)
            utterance.lang = lang || "en-US" // Ensure we always have a language
            utterance.rate = 1.0
            utterance.pitch = 1.0
            utterance.volume = 1.0

            // Set the voice if available
            const voice = getBestVoice(lang, voicePreference)
            if (voice) {
              utterance.voice = voice
              console.log(`Using voice: ${voice.name} (${voice.lang})`)
            } else {
              console.warn(`No matching voice found for ${lang}, using default`)
            }

            // Armazena a utterance atual para possível interrupção
            currentUtterance = utterance

            // Set up event handlers
            utterance.onstart = () => {
              isSpeaking = true
              currentUtterance = utterance
            }

            utterance.onend = () => {
              // Move to the next chunk or resolve if done
              speakNextChunk()
            }

            utterance.onerror = (event) => {
              // More detailed error logging
              console.error("Speech synthesis error:", event)

              // Log additional information about the utterance
              console.error("Failed utterance details:", {
                text: utterance.text.substring(0, 100) + (utterance.text.length > 100 ? "..." : ""),
                lang: utterance.lang,
                voice: utterance.voice ? utterance.voice.name : "default",
              })

              // Check if the browser's speech synthesis is available
              if (!window.speechSynthesis) {
                console.error("Speech synthesis not available")
              } else if (window.speechSynthesis.speaking) {
                console.warn("Speech synthesis was already speaking")
                try {
                  window.speechSynthesis.cancel()
                } catch (cancelError) {
                  console.error("Error canceling previous speech:", cancelError)
                }
              }

              // Try to recover by moving to the next chunk instead of stopping completely
              console.warn("Continuing to next chunk despite error")

              // Small delay before continuing to the next chunk
              setTimeout(() => {
                speakNextChunk()
              }, 100)
            }

            // Start speaking this chunk
            try {
              window.speechSynthesis.speak(utterance)
            } catch (speakError) {
              console.error("Error during speak call:", speakError)
              speakNextChunk() // Try to continue with the next chunk
            }

            // Safari/iOS bug workaround: speech can stop after 15s
            if (isSafari()) {
              const restartSpeech = () => {
                if (isSpeaking && currentUtterance === utterance) {
                  try {
                    window.speechSynthesis.pause()
                    window.speechSynthesis.resume()
                    setTimeout(restartSpeech, 10000)
                  } catch (restartError) {
                    console.error("Error during speech restart:", restartError)
                  }
                }
              }
              setTimeout(restartSpeech, 10000)
            }
          }

          // Start the first chunk
          speakNextChunk()
        } catch (innerError) {
          console.error("Error in speech processing:", innerError)
          resolve() // Resolve instead of reject to allow the app to continue
        }
      }, 100) // Small delay to ensure previous speech is canceled
    } catch (error) {
      console.error("Failed to initialize speech:", error)
      resolve() // Resolve instead of reject to allow the app to continue
    }
  })
}

// Check if browser is Safari
function isSafari() {
  return typeof window !== "undefined" && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

// Public API

// Speak text
export async function speak(text: string, lang = "en-US", voicePreference?: string): Promise<void> {
  if (!text) {
    console.warn("Empty text provided to speak function")
    return Promise.resolve()
  }

  if (!isSpeechSynthesisSupported()) {
    console.warn("Speech synthesis not supported in this browser")
    // Fallback: Log the text that would have been spoken
    console.log("Text that would have been spoken:", text)
    return Promise.resolve()
  }

  // Check if speech synthesis is in a broken state
  try {
    const state = window.speechSynthesis.getVoices().length === 0 && !window.speechSynthesis.onvoiceschanged
    if (state) {
      console.warn("Speech synthesis appears to be in a broken state")
      return Promise.resolve()
    }
  } catch (error) {
    console.error("Error checking speech synthesis state:", error)
    return Promise.resolve()
  }

  // Ensure voices are loaded
  if (window.speechSynthesis.getVoices().length === 0) {
    console.log("No voices loaded yet, waiting for voices to load")

    // Wait for voices to load if they haven't already
    if (typeof window.speechSynthesis.onvoiceschanged !== "function") {
      await new Promise<void>((resolve) => {
        window.speechSynthesis.onvoiceschanged = () => {
          initVoiceMap()
          resolve()
        }

        // Set a timeout in case voices never load
        setTimeout(() => {
          console.warn("Timed out waiting for voices to load")
          resolve()
        }, 3000)
      })
    }
  }

  console.log(
    `TTS: Speaking text (${text.length} chars) in ${lang} with voice preference: ${voicePreference || "default"}`,
  )

  // Add to queue
  speakQueue.push({ text, lang, voice: voicePreference })

  // Start processing if not already
  if (!isProcessingQueue) {
    return processQueue().catch((error) => {
      console.error("Error in speech queue processing:", error)
      return Promise.resolve() // Resolve to allow the app to continue
    })
  }

  return Promise.resolve()
}

// Stop speaking
export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      // Cancela qualquer fala em andamento
      window.speechSynthesis.cancel()

      // Limpa a fila de fala
      if (currentUtterance) {
        currentUtterance = null
      }

      console.log("Fala interrompida com sucesso")
    } catch (error) {
      console.error("Erro ao interromper a fala:", error)
    }
  }
}

// Check if currently speaking
export function isSpeakingNow(): boolean {
  return isSpeaking
}

// Get available voices
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return []
  return window.speechSynthesis.getVoices()
}

export function isSpeechActive(): boolean {
  return isSpeaking
}
