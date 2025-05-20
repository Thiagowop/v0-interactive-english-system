// Speech Recognition Service for continuous listening and transcription

type RecognitionStatus = "inactive" | "listening" | "processing" | "error"

type RecognitionMode = "realtime" | "transcription"

type SpeechRecognitionOptions = {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
  timeout?: number // Timeout in milliseconds
  mode?: RecognitionMode // Mode of operation
}

type SpeechRecognitionCallbacks = {
  onResult?: (transcript: string, isFinal: boolean) => void
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
  onSoundLevel?: (level: number) => void
  onNoSpeech?: () => void // Callback for no-speech events
  onSilence?: () => void // Callback for silence detection
  onFinalizeTranscript?: (transcript: string) => void // Callback when transcript is finalized
  onSpeechStart?: () => void // Callback when user starts speaking
}

declare var SpeechRecognition: any
declare var webkitSpeechRecognition: any

class SpeechRecognitionService {
  private recognition: any | null = null
  private status: RecognitionStatus = "inactive"
  private audioContext: AudioContext | null = null
  private analyzer: AnalyserNode | null = null
  private microphone: MediaStreamAudioSourceNode | null = null
  private mediaStream: MediaStream | null = null
  private soundLevelInterval: number | null = null
  private callbacks: SpeechRecognitionCallbacks = {}
  private isListening = false
  private noSpeechTimeout: number | null = null
  private lastSpeechTime = 0
  private noSpeechTimer: NodeJS.Timeout | null = null
  private silenceTimer: NodeJS.Timeout | null = null
  private defaultTimeout = 10000 // 10 seconds default timeout
  private silenceThreshold = 12000 // Aumentado para 12000ms (12 segundos)
  private currentTranscript = ""
  private mode: RecognitionMode = "transcription"
  private restartCount = 0
  private maxRestarts = 5 // Aumentado para permitir mais tentativas antes de desistir
  private finalizeTimeout: NodeJS.Timeout | null = null
  private isInitializing = false
  private pendingRestart = false
  private lastStartTime = 0
  private minTimeBetweenRestarts = 1000 // Minimum time between restart attempts in ms
  private debugMode = true // Enable detailed logging
  private autoStopTimeout: NodeJS.Timeout | null = null
  private maxListeningTime = 60000 // 60 seconds max listening time for transcription mode
  private shouldStopAfterSilence = false // Flag to control if we should stop after silence
  private hasReceivedResults = false // Flag to track if we've received any results
  private isRestarting = false // Flag to track if we're in the process of restarting
  private restartTimer: NodeJS.Timeout | null = null // Timer for delayed restart
  private errorRecoveryAttempts = 0 // Contador para tentativas de recuperação de erros
  private maxErrorRecoveryAttempts = 5 // Máximo de tentativas de recuperação
  private recoveryBackoffTime = 1000 // Tempo inicial de espera para nova tentativa (ms)
  private lastErrorTime = 0 // Timestamp do último erro
  private errorCooldownPeriod = 60000 // Período de cooldown para resetar contadores de erro (1 minuto)
  private lastTimerResetTime = 0 // Timestamp da última reinicialização de timer
  private minTimeBetweenTimerResets = 1000 // Tempo mínimo entre reinicializações de timer (1 segundo)
  private isSpeaking = false // Flag para controlar se o usuário está falando ativamente
  private silenceDetectionDebounceTime = 3000 // Aumentado para 3 segundos
  private soundThreshold = 15 // Limiar para considerar que há som (0-100)

  // New properties for adaptive silence detection and sentence completion
  private adaptiveSilenceThreshold = 8000 // Initial value, will adapt based on user's speech patterns
  private minSilenceThreshold = 3000 // Minimum silence threshold (3 seconds)
  private maxSilenceThreshold = 12000 // Maximum silence threshold (12 seconds)
  private silenceThresholdAdjustmentFactor = 0.2 // How quickly to adjust the threshold
  private averageSentenceDuration = 0 // Average duration of user's sentences
  private sentenceCount = 0 // Number of sentences processed for averaging
  private lastSentenceEndTime = 0 // When the last sentence ended
  private sentenceCompletionBuffer: string[] = [] // Buffer to store potential sentence fragments
  private sentenceCompletionTimeout: NodeJS.Timeout | null = null // Timer for sentence completion
  private sentenceCompletionDelay = 2500 // Delay before finalizing a sentence (2.5 seconds)
  private isProcessingResults = false // Flag to prevent overlapping result processing
  private lastSoundLevel = 0 // Last detected sound level
  private soundLevelHistory: number[] = [] // History of sound levels for adaptive thresholding
  private soundLevelHistoryMaxSize = 50 // Maximum size of sound level history
  private consecutiveLowSoundLevelCount = 0 // Count of consecutive low sound level readings
  private consecutiveLowSoundLevelThreshold = 5 // Threshold for considering silence

  constructor() {
    this.initRecognition()
  }

  private log(...args: any[]) {
    if (this.debugMode) {
      console.log(`[SpeechRecognition]`, ...args)
    }
  }

  private initRecognition() {
    if (typeof window === "undefined") return

    // Check if browser supports speech recognition
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        this.recognition = new SpeechRecognition()

        // Set default properties
        this.recognition.continuous = true
        this.recognition.interimResults = true
        this.recognition.maxAlternatives = 1
        this.recognition.lang = "en-US"

        // Set up event handlers
        this.recognition.onstart = this.handleStart.bind(this)
        this.recognition.onend = this.handleEnd.bind(this)
        this.recognition.onerror = this.handleError.bind(this)
        this.recognition.onresult = this.handleResult.bind(this)
        this.recognition.onaudiostart = this.handleAudioStart.bind(this)
        this.recognition.onsoundstart = this.handleSoundStart.bind(this)
        this.recognition.onspeechstart = this.handleSpeechStart.bind(this)
        this.recognition.onspeechend = this.handleSpeechEnd.bind(this)
        this.recognition.onnomatch = this.handleNoMatch.bind(this)

        this.log("Speech recognition service initialized successfully")
      } catch (error) {
        console.error("Error initializing speech recognition:", error)
        this.status = "error"

        // Notificar sobre o erro de inicialização
        if (this.callbacks.onError) {
          this.callbacks.onError("Failed to initialize speech recognition")
        }
      }
    } else {
      console.warn("Speech Recognition API not supported in this browser")
      this.status = "error"

      // Notificar sobre a falta de suporte
      if (this.callbacks.onError) {
        this.callbacks.onError("Speech Recognition API not supported in this browser")
      }
    }
  }

  // Create a new recognition instance to avoid state issues
  private recreateRecognition() {
    this.log("Recreating recognition instance")

    // Clean up existing instance
    if (this.recognition) {
      try {
        // Remove all event listeners
        this.recognition.onstart = null
        this.recognition.onend = null
        this.recognition.onerror = null
        this.recognition.onresult = null
        this.recognition.onaudiostart = null
        this.recognition.onsoundstart = null
        this.recognition.onspeechstart = null
        this.recognition.onspeechend = null
        this.recognition.onnomatch = null

        // Stop if it's running
        if (this.status === "listening" || this.status === "processing") {
          try {
            this.recognition.stop()
          } catch (e) {
            // Ignore errors when stopping
          }
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
    }

    // Create new instance
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()

      // Set properties
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.maxAlternatives = 1
      this.recognition.lang = "en-US"

      // Set up event handlers
      this.recognition.onstart = this.handleStart.bind(this)
      this.recognition.onend = this.handleEnd.bind(this)
      this.recognition.onerror = this.handleError.bind(this)
      this.recognition.onresult = this.handleResult.bind(this)
      this.recognition.onaudiostart = this.handleAudioStart.bind(this)
      this.recognition.onsoundstart = this.handleSoundStart.bind(this)
      this.recognition.onspeechstart = this.handleSpeechStart.bind(this)
      this.recognition.onspeechend = this.handleSpeechEnd.bind(this)
      this.recognition.onnomatch = this.handleNoMatch.bind(this)

      this.log("Recognition instance recreated successfully")
      return true
    } catch (error) {
      console.error("Error recreating recognition instance:", error)
      this.status = "error"

      // Notificar sobre o erro de recriação
      if (this.callbacks.onError) {
        this.callbacks.onError("Failed to recreate speech recognition instance")
      }
      return false
    }
  }

  public setOptions(options: SpeechRecognitionOptions) {
    if (!this.recognition) return

    if (options.language) {
      this.recognition.lang = options.language
      this.log(`Language set to: ${options.language}`)
    }

    if (options.continuous !== undefined) {
      this.recognition.continuous = options.continuous
      this.log(`Continuous mode set to: ${options.continuous}`)
    }

    if (options.interimResults !== undefined) {
      this.recognition.interimResults = options.interimResults
      this.log(`Interim results set to: ${options.interimResults}`)
    }

    if (options.maxAlternatives) {
      this.recognition.maxAlternatives = options.maxAlternatives
      this.log(`Max alternatives set to: ${options.maxAlternatives}`)
    }

    if (options.timeout) {
      this.noSpeechTimeout = options.timeout
      this.log(`No speech timeout set to: ${options.timeout}ms`)
    }

    if (options.mode) {
      this.mode = options.mode
      this.log(`Recognition mode set to: ${options.mode}`)

      // Reset the shouldStopAfterSilence flag when mode changes
      this.shouldStopAfterSilence = this.mode === "transcription"
    }
  }

  public setCallbacks(callbacks: SpeechRecognitionCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
    this.log("Callbacks updated")
  }

  public getMode(): RecognitionMode {
    return this.mode
  }

  public setMode(mode: RecognitionMode) {
    this.mode = mode
    this.log(`Speech recognition mode set to: ${mode}`)

    // Reset the shouldStopAfterSilence flag when mode changes
    this.shouldStopAfterSilence = mode === "transcription"

    // If we're already listening, restart with the new mode
    if (this.isListening) {
      this.log("Restarting recognition with new mode")
      this.stop()
      // Use a timeout to ensure stop completes before starting again
      setTimeout(() => this.start(), 300)
    }
  }

  public start() {
    if (!this.recognition) {
      console.error("Speech recognition not supported in this browser")
      if (this.callbacks.onError) {
        this.callbacks.onError("Speech recognition not supported")
      }
      return
    }

    // Prevent starting if already initializing or restarting
    if (this.isInitializing || this.isRestarting) {
      this.log("Already initializing or restarting, ignoring start request")
      return
    }

    // Prevent rapid restarts
    const now = Date.now()
    if (now - this.lastStartTime < this.minTimeBetweenRestarts) {
      this.log("Start request too soon after previous start, delaying")
      this.pendingRestart = true
      setTimeout(() => {
        if (this.pendingRestart) {
          this.pendingRestart = false
          this.start()
        }
      }, this.minTimeBetweenRestarts)
      return
    }

    this.lastStartTime = now
    this.isInitializing = true
    this.hasReceivedResults = false
    this.isSpeaking = false

    try {
      // Reset state
      this.currentTranscript = ""
      this.restartCount = 0
      this.isListening = true
      this.status = "listening"
      this.shouldStopAfterSilence = this.mode === "transcription"

      // Reset sentence completion buffer
      this.sentenceCompletionBuffer = []
      this.clearSentenceCompletionTimeout()

      // Clean up any existing recognition session
      this.cleanupRecognition()

      // Recreate the recognition instance to avoid state issues
      this.recreateRecognition()

      // Start recognition
      this.log("Starting speech recognition")
      this.recognition.start()

      // Start audio analysis for sound level
      this.startAudioAnalysis()
      this.startNoSpeechTimer()

      // Set a maximum listening time for transcription mode
      if (this.mode === "transcription") {
        this.startAutoStopTimer()
      }

      this.log(`Started speech recognition in ${this.mode} mode`)
    } catch (error) {
      console.error("Error starting speech recognition:", error)
      this.isListening = false
      this.status = "error"
      this.isInitializing = false

      if (this.callbacks.onError) {
        this.callbacks.onError("Failed to start speech recognition")
      }

      // Tentar recuperação automática após um erro de inicialização
      this.scheduleErrorRecovery()
    }
  }

  // Método para agendar uma tentativa de recuperação após erro
  private scheduleErrorRecovery() {
    const now = Date.now()

    // Resetar contador de tentativas se passou tempo suficiente desde o último erro
    if (now - this.lastErrorTime > this.errorCooldownPeriod) {
      this.errorRecoveryAttempts = 0
      this.recoveryBackoffTime = 1000
    }

    this.lastErrorTime = now

    // Verificar se ainda não excedemos o número máximo de tentativas
    if (this.errorRecoveryAttempts < this.maxErrorRecoveryAttempts) {
      this.errorRecoveryAttempts++

      // Calcular tempo de espera com backoff exponencial
      const waitTime = this.recoveryBackoffTime * Math.pow(1.5, this.errorRecoveryAttempts - 1)
      this.log(`Scheduling error recovery attempt ${this.errorRecoveryAttempts} in ${waitTime}ms`)

      setTimeout(() => {
        if (this.status === "error" && !this.isListening) {
          this.log(`Executing recovery attempt ${this.errorRecoveryAttempts}`)
          this.recreateRecognition()
          this.start()
        }
      }, waitTime)

      // Aumentar o tempo de backoff para a próxima tentativa
      this.recoveryBackoffTime = waitTime
    } else {
      this.log("Maximum error recovery attempts reached")

      // Notificar sobre falha na recuperação
      if (this.callbacks.onError) {
        this.callbacks.onError("Failed to recover from speech recognition errors after multiple attempts")
      }
    }
  }

  private startAutoStopTimer() {
    this.clearAutoStopTimer()

    this.log(`Setting auto-stop timer for ${this.maxListeningTime}ms`)
    this.autoStopTimeout = setTimeout(() => {
      if (this.isListening && this.mode === "transcription") {
        this.log("Max listening time reached, auto-stopping")

        // Finalize any transcript before stopping
        if (this.currentTranscript.trim()) {
          this.finalizeTranscript()
        }

        this.stop()
      }
    }, this.maxListeningTime)
  }

  private clearAutoStopTimer() {
    if (this.autoStopTimeout) {
      clearTimeout(this.autoStopTimeout)
      this.autoStopTimeout = null
    }
  }

  public stop() {
    this.log("Stop requested")
    this.pendingRestart = false
    this.clearRestartTimer()

    if (!this.recognition) {
      this.log("No recognition instance to stop")
      return
    }

    try {
      this.isListening = false
      this.stopNoSpeechTimer()
      this.stopSilenceTimer()
      this.clearFinalizeTimeout()
      this.clearAutoStopTimer()
      this.clearSentenceCompletionTimeout()

      // Only call stop if we're actually listening
      if (this.status === "listening" || this.status === "processing") {
        this.log("Stopping speech recognition")
        try {
          this.recognition.stop()
        } catch (e) {
          this.log("Error stopping recognition, recreating instance:", e)
          this.recreateRecognition()
        }
      }

      this.stopAudioAnalysis()

      // Finalize any remaining transcript
      this.finalizeTranscript()

      this.status = "inactive"
      this.log("Stopped speech recognition")

      // Notify about end if not already handled by onend
      if (this.callbacks.onEnd) {
        this.callbacks.onEnd()
      }
    } catch (error) {
      console.error("Error stopping speech recognition:", error)
      // Still update our internal state
      this.status = "inactive"
      this.isListening = false

      // Try to recreate the recognition instance
      this.recreateRecognition()
    }
  }

  private cleanupRecognition() {
    // Clean up any existing timers
    this.stopNoSpeechTimer()
    this.stopSilenceTimer()
    this.clearFinalizeTimeout()
    this.clearAutoStopTimer()
    this.clearRestartTimer()
    this.clearSentenceCompletionTimeout()
    this.stopAudioAnalysis()

    // If there's an active recognition session, try to stop it
    if (this.status === "listening" || this.status === "processing") {
      try {
        this.recognition.stop()
      } catch (error) {
        // Ignore errors when stopping
        this.log("Error while cleaning up recognition:", error)
        // Try to recreate the recognition instance
        this.recreateRecognition()
      }
    }
  }

  public toggle() {
    this.log(`Toggle requested, current status: ${this.status}, isListening: ${this.isListening}`)

    if (this.isListening) {
      this.stop()
      return false
    } else {
      this.start()
      return true
    }
  }

  public getStatus(): RecognitionStatus {
    return this.status
  }

  public isActive(): boolean {
    return this.isListening
  }

  private handleStart() {
    this.log("Recognition started event received")
    this.isInitializing = false
    this.isRestarting = false
    this.status = "listening"
    this.lastSpeechTime = Date.now()

    if (this.callbacks.onStart) {
      this.callbacks.onStart()
    }
  }

  private handleEnd() {
    this.log("Recognition ended event received, isListening:", this.isListening)
    this.stopNoSpeechTimer()
    this.stopSilenceTimer()
    this.clearAutoStopTimer()
    this.isInitializing = false

    // If we're supposed to be listening but recognition stopped, restart it
    if (this.isListening && !this.isRestarting) {
      try {
        // Only restart if we haven't exceeded the max restart count
        if (this.restartCount < this.maxRestarts) {
          this.restartCount++
          this.log(`Scheduling restart of speech recognition (attempt ${this.restartCount})`)

          // Mark that we're in the process of restarting
          this.isRestarting = true

          // Clear any existing restart timer
          this.clearRestartTimer()

          // Schedule a restart with a delay
          this.restartTimer = setTimeout(() => {
            if (this.isListening) {
              try {
                this.log("Executing scheduled restart")

                // Recreate the recognition instance to avoid state issues
                if (this.recreateRecognition()) {
                  this.recognition.start()
                  this.startNoSpeechTimer()
                  if (this.mode === "transcription") {
                    this.startAutoStopTimer()
                  }
                } else {
                  throw new Error("Failed to recreate recognition instance")
                }
              } catch (error) {
                console.error("Error during scheduled restart:", error)
                this.isListening = false
                this.isRestarting = false
                this.status = "inactive"

                if (this.callbacks.onEnd) {
                  this.callbacks.onEnd()
                }
              }
            } else {
              this.isRestarting = false
            }
          }, 500) // Increased delay before restarting
        } else {
          this.log("Max restart attempts reached, stopping recognition")
          this.isListening = false
          this.status = "inactive"

          // Finalize any remaining transcript
          this.finalizeTranscript()

          if (this.callbacks.onEnd) {
            this.callbacks.onEnd()
          }
        }
      } catch (error) {
        console.error("Error handling recognition end:", error)
        this.isListening = false
        this.isRestarting = false
        this.status = "inactive"

        if (this.callbacks.onError) {
          this.callbacks.onError("Recognition stopped unexpectedly")
        }

        if (this.callbacks.onEnd) {
          this.callbacks.onEnd()
        }
      }
    } else {
      this.status = "inactive"
      this.isRestarting = false

      if (this.callbacks.onEnd) {
        this.callbacks.onEnd()
      }
    }
  }

  private clearRestartTimer() {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer)
      this.restartTimer = null
    }
  }

  private handleError(event: any) {
    this.log(`Recognition error: ${event.error}`)
    this.status = "error"
    this.isInitializing = false
    this.isRestarting = false

    // Handle no-speech error differently
    if (event.error === "no-speech") {
      this.log("No speech detected within timeout period")

      // Notify about no speech but don't treat as error
      if (this.callbacks.onNoSpeech) {
        this.callbacks.onNoSpeech()
      }

      // In transcription mode, finalize the transcript if there's any content
      if (this.mode === "transcription" && this.currentTranscript.trim()) {
        this.finalizeTranscript()
      }

      // Don't report no-speech as an error to the UI
      // Just restart recognition if it's supposed to be continuous
      if (this.isListening && this.recognition?.continuous) {
        // Only restart if we haven't exceeded the max restart count
        if (this.restartCount < this.maxRestarts) {
          this.restartCount++
          this.log(`Scheduling restart after no-speech (attempt ${this.restartCount})`)

          // Mark that we're in the process of restarting
          this.isRestarting = true

          // Clear any existing restart timer
          this.clearRestartTimer()

          // Schedule a restart with a delay
          this.restartTimer = setTimeout(() => {
            try {
              if (this.isListening) {
                this.log("Executing scheduled restart after no-speech")

                // Recreate the recognition instance to avoid state issues
                if (this.recreateRecognition()) {
                  this.recognition.start()
                  this.startNoSpeechTimer()
                  if (this.mode === "transcription") {
                    this.startAutoStopTimer()
                  }
                } else {
                  throw new Error("Failed to recreate recognition instance")
                }
              }
              this.isRestarting = false
            } catch (error) {
              console.error("Error restarting speech recognition after no-speech:", error)
              this.isListening = false
              this.isRestarting = false
              this.status = "inactive"

              if (this.callbacks.onEnd) {
                this.callbacks.onEnd()
              }
            }
          }, 500)
        } else {
          this.log("Max restart attempts reached after no-speech, stopping recognition")
          this.isListening = false
          this.status = "inactive"

          // Finalize any remaining transcript
          this.finalizeTranscript()

          if (this.callbacks.onEnd) {
            this.callbacks.onEnd()
          }
        }
      }
      return
    }

    // For other errors, log and notify
    console.error("Speech recognition error:", event.error)

    // Report other errors to the UI
    if (this.callbacks.onError) {
      this.callbacks.onError(event.error)
    }

    // Restart recognition if it's supposed to be continuous
    if (this.isListening && this.recognition?.continuous) {
      // Only restart if we haven't exceeded the max restart count
      if (this.restartCount < this.maxRestarts) {
        this.restartCount++
        this.log(`Scheduling restart after error (attempt ${this.restartCount})`)

        // Mark that we're in the process of restarting
        this.isRestarting = true

        // Clear any existing restart timer
        this.clearRestartTimer()

        // Schedule a restart with a delay
        this.restartTimer = setTimeout(() => {
          try {
            if (this.isListening) {
              this.log("Executing scheduled restart after error")

              // Recreate the recognition instance to avoid state issues
              if (this.recreateRecognition()) {
                this.recognition.start()
                this.startNoSpeechTimer()
                this.recognition.start()
                this.startNoSpeechTimer()
                if (this.mode === "transcription") {
                  this.startAutoStopTimer()
                } else {
                  throw new Error("Failed to recreate recognition instance");
                }
                this.isRestarting = false
              }
            } catch (error) \
              console.error("Error restarting speech recognition after error:", error);
              this.isListening = false;
              this.isRestarting = false;
              this.status = "inactive";

              if (this.callbacks.onEnd) {
                this.callbacks.onEnd();
              }
          }, 1000)
        } else {
          this.log("Max restart attempts reached after error, stopping recognition")
          this.isListening = false
          this.status = "inactive"

          // Finalize any remaining transcript
          this.finalizeTranscript()

        if (this.callbacks.onEnd) {
          this.callbacks.onEnd()
        }

        // Agendar tentativa de recuperação após falha
        this.scheduleErrorRecovery()
      }
    }
  }

  private handleResult(event: any) {
    // Prevent overlapping result processing
    if (this.isProcessingResults) {
      this.log("Already processing results, deferring new results")
      return
    }

    this.isProcessingResults = true

    try {
      this.status = "processing"
      this.lastSpeechTime = Date.now() // Update last speech time
      this.isSpeaking = true // Marcar que o usuário está falando ativamente

      // Só reinicia os timers se passou tempo suficiente desde a última reinicialização
      const now = Date.now()
      if (now - this.lastTimerResetTime > this.minTimeBetweenTimerResets) {
        this.resetNoSpeechTimer() // Reset the timer when we get results
        this.startSilenceTimer() // Start silence detection timer
        this.lastTimerResetTime = now
      }

      this.hasReceivedResults = true // Mark that we've received results

      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      // In real-time mode, we want to process each final transcript immediately
      if (this.mode === "realtime" && finalTranscript) {
        this.log(`Realtime final transcript: "${finalTranscript}"`)

        if (this.callbacks.onResult) {
          this.callbacks.onResult(finalTranscript, true)
        }

        // In real-time mode, we also want to finalize each transcript segment
        if (this.callbacks.onFinalizeTranscript) {
          this.callbacks.onFinalizeTranscript(finalTranscript)
        }
      }
      // In transcription mode, we accumulate the transcript
      else if (this.mode === "transcription") {
        if (finalTranscript) {
          // Add to the sentence completion buffer
          this.sentenceCompletionBuffer.push(finalTranscript)

          // Update the current transcript with all buffer contents
          const combinedTranscript = this.sentenceCompletionBuffer.join(" ")
          this.currentTranscript = combinedTranscript.trim()

          this.log(`Accumulated transcript: "${this.currentTranscript}"`)

          // Schedule sentence completion after a delay
          this.scheduleSentenceCompletion()

          if (this.callbacks.onResult) {
            this.callbacks.onResult(this.currentTranscript, false)
          }
        }
      }

      // Always report interim results
      if (interimTranscript && this.callbacks.onResult) {
        if (this.mode === "transcription") {
          // In transcription mode, show accumulated transcript + current interim
          const fullInterim = this.currentTranscript + " " + interimTranscript
          this.log(`Interim transcript (transcription mode): "${fullInterim}"`)
          this.callbacks.onResult(fullInterim, false)
        } else {
          // In real-time mode, just show current interim
          this.log(`Interim transcript (realtime mode): "${interimTranscript}"`)
          this.callbacks.onResult(interimTranscript, false)
        }
      }

      if (!this.isListening) {
        this.status = "inactive"
      } else {
        this.status = "listening"
      }

      // Update adaptive silence threshold based on sentence duration
      if (finalTranscript) {
        this.updateAdaptiveSilenceThreshold(finalTranscript)
      }
    } finally {
      this.isProcessingResults = false
    }
  }

  // New method to update adaptive silence threshold
  private updateAdaptiveSilenceThreshold(finalTranscript: string) {
    const now = Date.now()

    // Only update if we have a previous sentence end time
    if (this.lastSentenceEndTime > 0) {
      const sentenceDuration = now - this.lastSentenceEndTime

      // Update average sentence duration
      if (this.sentenceCount === 0) {
        this.averageSentenceDuration = sentenceDuration
      } else {
        // Weighted average to gradually adapt
        this.averageSentenceDuration =
          (this.averageSentenceDuration * this.sentenceCount + sentenceDuration) / (this.sentenceCount + 1)
      }

      this.sentenceCount++

      // Adjust silence threshold based on average sentence duration
      // Longer sentences -> longer silence threshold
      const newThreshold = Math.min(
        this.maxSilenceThreshold,
        Math.max(
          this.minSilenceThreshold,
          this.averageSentenceDuration * 0.5, // 50% of average sentence duration
        ),
      )

      // Gradually adjust the threshold
      this.adaptiveSilenceThreshold =
        this.adaptiveSilenceThreshold * (1 - this.silenceThresholdAdjustmentFactor) +
        newThreshold * this.silenceThresholdAdjustmentFactor

      this.log(
        `Updated adaptive silence threshold to ${this.adaptiveSilenceThreshold}ms based on sentence duration ${sentenceDuration}ms`,
      )
    }

    this.lastSentenceEndTime = now
  }

  // New method to schedule sentence completion
  private scheduleSentenceCompletion() {
    this.clearSentenceCompletionTimeout()

    this.sentenceCompletionTimeout = setTimeout(() => {
      if (this.currentTranscript.trim() && this.mode === "transcription") {
        this.log("Finalizing transcript due to sentence completion timeout")
        this.finalizeTranscript()
      }
    }, this.sentenceCompletionDelay)
  }

  // New method to clear sentence completion timeout
  private clearSentenceCompletionTimeout() {
    if (this.sentenceCompletionTimeout) {
      clearTimeout(this.sentenceCompletionTimeout)
      this.sentenceCompletionTimeout = null
    }
  }

  private handleAudioStart() {
    this.log("Audio capture started")
  }

  private handleSoundStart() {
    this.log("Sound detected")
  }

  private handleSpeechStart() {
    this.log("Speech started")
    this.lastSpeechTime = Date.now()
    this.isSpeaking = true

    // Só reinicia os timers se passou tempo suficiente desde a última reinicialização
    const now = Date.now()
    if (now - this.lastTimerResetTime > this.minTimeBetweenTimerResets) {
      this.resetNoSpeechTimer()
      this.stopSilenceTimer() // Stop silence timer when speech starts
      this.lastTimerResetTime = now
    }

    // Notificar sobre o início da fala do usuário
    if (this.callbacks.onSpeechStart) {
      this.callbacks.onSpeechStart()
    }
  }

  private handleSpeechEnd() {
    this.log("Speech ended")
    this.isSpeaking = false

    // Só inicia o timer de silêncio se passou tempo suficiente desde a última reinicialização
    const now = Date.now()
    if (now - this.lastTimerResetTime > this.minTimeBetweenTimerResets) {
      this.startSilenceTimer() // Start silence timer when speech ends
      this.lastTimerResetTime = now
    }
  }

  private handleNoMatch() {
    this.log("Speech recognized but no match found")
  }

  // Start a timer to detect when no speech has been heard for a while
  private startNoSpeechTimer() {
    this.stopNoSpeechTimer() // Clear any existing timer

    const timeout = this.noSpeechTimeout || this.defaultTimeout
    this.log(`Starting no-speech timer with timeout ${timeout}ms`)

    this.noSpeechTimer = setTimeout(() => {
      const timeSinceLastSpeech = Date.now() - this.lastSpeechTime

      if (timeSinceLastSpeech > timeout && this.isListening) {
        this.log(`No speech detected for ${timeSinceLastSpeech}ms`)

        // Notify about no speech
        if (this.callbacks.onNoSpeech) {
          this.callbacks.onNoSpeech()
        }

        // Only finalize and stop if we've received results before
        // This prevents stopping when no speech has been detected at all
        if (this.hasReceivedResults) {
          // In transcription mode, finalize the transcript if there's any content
          if (this.mode === "transcription" && this.currentTranscript.trim()) {
            this.finalizeTranscript()

            // Only stop if we should stop after silence
            if (this.shouldStopAfterSilence) {
              this.stop()
              return
            }
          }
        }

        // Optionally restart recognition
        if (this.restartCount < this.maxRestarts) {
          this.log("Restarting after no-speech timeout")
          this.stop()
          setTimeout(() => {
            if (this.isListening) {
              this.start()
            }
          }, 500)
        } else {
          this.log("Max restart attempts reached, stopping after no-speech")
          this.stop()
        }
      }
    }, timeout)
  }

  private resetNoSpeechTimer() {
    // Só reinicia o timer se não estiver falando ativamente
    if (!this.isSpeaking) {
      this.stopNoSpeechTimer()
      this.startNoSpeechTimer()
    }
  }

  private stopNoSpeechTimer() {
    if (this.noSpeechTimer) {
      clearTimeout(this.noSpeechTimer)
      this.noSpeechTimer = null
    }
  }

  // Start a timer to detect silence after speech
  private startSilenceTimer() {
    // Use the adaptive silence threshold instead of the fixed one
    const threshold = this.adaptiveSilenceThreshold
    this.log(`Starting silence timer with adaptive threshold ${threshold}ms`)

    this.silenceTimer = setTimeout(() => {
      const timeSinceLastSpeech = Date.now() - this.lastSpeechTime

      // Verificar se ainda está falando com base no nível de som recente
      const isStillSpeaking = this.lastSoundLevel > this.soundThreshold * 1.2

      if (timeSinceLastSpeech > threshold && this.isListening && !isStillSpeaking) {
        this.log(`Silence detected for ${timeSinceLastSpeech}ms, sound level: ${this.lastSoundLevel}`)

        // Notify about silence
        if (this.callbacks.onSilence) {
          this.callbacks.onSilence()
        }

        // In transcription mode, finalize the transcript after silence
        if (this.mode === "transcription" && this.currentTranscript.trim()) {
          this.log("Finalizing transcript due to silence")

          // Ensure we finalize before potentially stopping
          this.finalizeTranscript()

          // Only stop if we should stop after silence
          if (this.shouldStopAfterSilence) {
            this.log("Stopping after silence in transcription mode")

            // Add a longer delay before stopping to ensure finalization completes
            setTimeout(() => {
              // Verificar novamente se não está falando antes de parar
              if (Date.now() - this.lastSpeechTime > threshold) {
                this.stop()
              } else {
                this.log("Detected new speech, canceling stop")
              }
            }, 2000) // Aumentado para 2 segundos
          }
        }
      }
    }, threshold + this.silenceDetectionDebounceTime) // Adicionado tempo de debounce
  }

  private stopSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
      this.silenceTimer = null
    }
  }

  // Schedule finalization of transcript after a delay
  private scheduleFinalizeTimeout() {
    this.clearFinalizeTimeout()

    this.finalizeTimeout = setTimeout(() => {
      if (this.currentTranscript.trim() && this.mode === "transcription") {
        this.log("Finalizing transcript due to timeout")
        this.finalizeTranscript()
      }
    }, 3000) // Aumentado de 2000ms para 3000ms
  }

  private clearFinalizeTimeout() {
    if (this.finalizeTimeout) {
      clearTimeout(this.finalizeTimeout)
      this.finalizeTimeout = null
    }
  }

  // Finalize the current transcript
  private finalizeTranscript() {
    if (this.currentTranscript.trim() && this.callbacks.onFinalizeTranscript) {
      this.log(`Finalizing transcript: "${this.currentTranscript}"`)

      // Ensure we're not finalizing an empty transcript
      if (this.currentTranscript.trim().length > 0) {
        // Make a copy of the transcript before clearing it to avoid race conditions
        const transcriptToFinalize = this.currentTranscript.trim()

        // Clear the current transcript and buffer before calling the callback
        this.currentTranscript = ""
        this.sentenceCompletionBuffer = []

        // Call the callback with the finalized transcript
        this.callbacks.onFinalizeTranscript(transcriptToFinalize)
      }
    }
  }

  // Set whether to stop after silence in transcription mode
  public setShouldStopAfterSilence(shouldStop: boolean) {
    this.shouldStopAfterSilence = shouldStop
    this.log(`Set shouldStopAfterSilence to ${shouldStop}`)
  }

  // Método público para acionar o evento de ausência de fala
  public triggerNoSpeechEvent() {
    this.log("Manually triggering no-speech event")

    // Notificar sobre ausência de fala
    if (this.callbacks.onNoSpeech) {
      this.callbacks.onNoSpeech()
    }

    // Em modo de transcrição, finalizar a transcrição se houver conteúdo
    if (this.mode === "transcription" && this.currentTranscript.trim()) {
      this.finalizeTranscript()

      // Parar após silêncio se configurado
      if (this.shouldStopAfterSilence) {
        this.stop()
      }
    }
  }

  // Audio level analysis for visualizing microphone input
  private async startAudioAnalysis() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("getUserMedia not supported")
      return
    }

    try {
      // Clean up any existing audio analysis
      this.stopAudioAnalysis()

      this.log("Starting audio analysis")
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.analyzer = this.audioContext.createAnalyser()
      this.analyzer.fftSize = 256
      this.microphone = this.audioContext.createMediaStreamSource(this.mediaStream)
      this.microphone.connect(this.analyzer)

      // Don't connect to destination to avoid feedback
      // this.analyzer.connect(this.audioContext.destination);

      this.analyzeSoundLevel()
    } catch (error) {
      console.error("Error accessing microphone:", error)

      // Notificar sobre erro de acesso ao microfone
      if (this.callbacks.onError) {
        this.callbacks.onError("Failed to access microphone. Please check your microphone permissions.")
      }
    }
  }

  private stopAudioAnalysis() {
    this.log("Stopping audio analysis")

    if (this.soundLevelInterval) {
      clearInterval(this.soundLevelInterval)
      this.soundLevelInterval = null
    }

    if (this.microphone) {
      this.microphone.disconnect()
      this.microphone = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop())
      this.mediaStream = null
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch(console.error)
      this.audioContext = null
    }

    this.analyzer = null
  }

  private analyzeSoundLevel() {
    if (!this.analyzer) return

    const dataArray = new Uint8Array(this.analyzer.frequencyBinCount)

    this.soundLevelInterval = window.setInterval(() => {
      if (!this.analyzer) return

      this.analyzer.getByteFrequencyData(dataArray)

      // Calculate average volume level
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i]
      }
      const average = sum / dataArray.length

      // Normalize to 0-100 range
      const normalizedLevel = Math.min(100, Math.max(0, average))

      // Store the current sound level
      this.lastSoundLevel = normalizedLevel

      // Add to history for adaptive thresholding
      this.soundLevelHistory.push(normalizedLevel)
      if (this.soundLevelHistory.length > this.soundLevelHistoryMaxSize) {
        this.soundLevelHistory.shift()
      }

      // Track consecutive low sound levels for better silence detection
      if (normalizedLevel < this.soundThreshold) {
        this.consecutiveLowSoundLevelCount++

        // If we have enough consecutive low readings, consider it silence
        if (this.consecutiveLowSoundLevelCount >= this.consecutiveLowSoundLevelThreshold) {
          // Only update if it's been a while since the last speech
          const timeSinceLastSpeech = Date.now() - this.lastSpeechTime
          if (timeSinceLastSpeech > 1000) {
            // At least 1 second of silence
            // Don't update lastSpeechTime here to allow silence timers to work
          }
        }
      } else {
        // Reset counter when sound is detected
        this.consecutiveLowSoundLevelCount = 0

        // If we detect sound above threshold, update the last speech time
        if (normalizedLevel > this.soundThreshold) {
          this.lastSpeechTime = Date.now()
        }
      }

      if (this.callbacks.onSoundLevel) {
        this.callbacks.onSoundLevel(normalizedLevel)
      }
    }, 100)
  }
}

// Create a singleton instance
let speechRecognitionService: SpeechRecognitionService | null = null

export function getSpeechRecognitionService(): SpeechRecognitionService {
  if (!speechRecognitionService) {
    speechRecognitionService = new SpeechRecognitionService()
  }
  return speechRecognitionService
}
