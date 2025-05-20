"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { speak, stopSpeaking } from "@/lib/simple-tts"
import { useChat } from "@/contexts/chat-context"
import { useAvatar } from "@/contexts/avatar-context"
import { useLanguage, useTranslation } from "@/components/language-context"
import { Send, Mic, Loader2, MicOff, Volume2, AlertCircle, HelpCircle, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { processStudentInputWithGemini, translateWithGemini } from "@/lib/gemini-service"
import { getWordDefinitionWithGemini } from "@/lib/gemini-service"
import { WordDefinition } from "@/components/word-definition"
import { getSpeechRecognitionService } from "@/lib/speech-recognition-service"
import ChatModeSelector from "@/components/chat-mode-selector"
import logger from "@/lib/logger-service"
import { useEnvironment } from "@/contexts/environment-context"

type ChatMode = "realtime" | "transcription"

// Interface para estado de processamento
interface ProcessingState {
  isProcessing: boolean
  isAutoResponding: boolean
  isSpeaking: boolean
  isLoadingDefinition: boolean
}

// Interface para estado de reconhecimento de fala
interface SpeechState {
  isRecording: boolean
  microphoneLevel: number
  interimTranscript: string
  noSpeechDetected: boolean
  listeningDuration: number
}

export default function ChatInterface() {
  const { messages, setMessages, updateExtractedVocabulary } = useChat()
  const { avatarName, avatarVoice } = useAvatar()
  const { speechLanguage } = useLanguage()
  const t = useTranslation()
  const { environment } = useEnvironment()

  // Estado de entrada e configurações
  const [input, setInput] = useState("")
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [wordDefinition, setWordDefinition] = useState<any>(null)
  const [chatMode, setChatMode] = useState<ChatMode>("transcription")
  const [autoSendAfterSilence, setAutoSendAfterSilence] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showAutoSendTooltip, setShowAutoSendTooltip] = useState(false)

  // Estado de processamento
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    isAutoResponding: false,
    isSpeaking: false,
    isLoadingDefinition: false,
  })

  // Estado de reconhecimento de fala
  const [speechState, setSpeechState] = useState<SpeechState>({
    isRecording: false,
    microphoneLevel: 0,
    interimTranscript: "",
    noSpeechDetected: false,
    listeningDuration: 0,
  })

  // Estado de prevenção de duplicação
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState("")
  const lastProcessedTimestampRef = useRef<number>(0)
  const processingQueueRef = useRef<boolean>(false)
  const duplicatePreventionTimeWindowMs = 3000 // 3 segundos para evitar duplicações
  const inputRef = useRef<string>("")

  // Referências
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const speakAttemptRef = useRef(0)
  const listeningStartTimeRef = useRef<number | null>(null)
  const listeningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const speechRecognitionRef = useRef(getSpeechRecognitionService())
  const { toast } = useToast()
  const errorRetryCountRef = useRef<Record<string, number>>({})
  const maxErrorRetries = 3

  // Função para atualizar o estado de fala de forma parcial
  const updateSpeechState = useCallback((updates: Partial<SpeechState>) => {
    setSpeechState((prev) => ({ ...prev, ...updates }))
  }, [])

  // Referência para o timeout de finalização de transcrição
  const transcriptionFinalizationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Função para atualizar o estado de processamento de forma parcial
  const updateProcessingState = useCallback((updates: Partial<ProcessingState>) => {
    setProcessingState((prev) => ({ ...prev, ...updates }))
  }, [])

  // Função para interromper a fala quando o usuário começa a falar
  const interruptSpeechOnUserInput = useCallback(() => {
    if (chatMode === "realtime" && processingState.isSpeaking) {
      logger.info("TTS", "Interrompendo fala atual para priorizar entrada do usuário")
      stopSpeaking()
      updateProcessingState({ isSpeaking: false })
    }
  }, [chatMode, processingState.isSpeaking, updateProcessingState])

  // Sincronizar input com inputRef para evitar problemas de closure
  useEffect(() => {
    inputRef.current = input
  }, [input])

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    // Registrar callback para erros recorrentes
    logger.onErrorThreshold((category, count) => {
      if (count === -1) {
        // Erro fatal
        toast({
          title: "Erro crítico detectado",
          description: `Um erro crítico ocorreu na categoria ${category}. Por favor, recarregue a aplicação.`,
          variant: "destructive",
        })
      } else {
        // Erros recorrentes
        toast({
          title: "Problemas detectados",
          description: `Múltiplos erros (${count}) detectados na categoria ${category}. Algumas funcionalidades podem estar comprometidas.`,
          variant: "destructive",
        })
      }
    })

    return () => {
      stopSpeaking()

      // Make sure to stop speech recognition when component unmounts
      const speechRecognition = speechRecognitionRef.current
      if (speechRecognition && speechRecognition.isActive()) {
        speechRecognition.stop()
      }

      if (listeningTimerRef.current) {
        clearInterval(listeningTimerRef.current)
        listeningTimerRef.current = null
      }

      // Limpar outras referências
      processingQueueRef.current = false

      // Limpar timeout de finalização de transcrição
      if (transcriptionFinalizationTimeoutRef.current) {
        clearTimeout(transcriptionFinalizationTimeoutRef.current)
        transcriptionFinalizationTimeoutRef.current = null
      }
    }
  }, [toast])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Fetch word definition when a word is selected
  useEffect(() => {
    async function fetchDefinition() {
      if (selectedWord) {
        updateProcessingState({ isLoadingDefinition: true })
        try {
          logger.info("WordDefinition", `Buscando definição para: ${selectedWord}`)
          const definition = await getWordDefinitionWithGemini(selectedWord)
          setWordDefinition(definition)
        } catch (error) {
          logger.error("WordDefinition", `Erro ao buscar definição: ${error}`)
          setWordDefinition({ error: "Failed to fetch definition" })

          // Tentar novamente com backoff exponencial
          const retryCount = errorRetryCountRef.current.wordDefinition || 0
          if (retryCount < maxErrorRetries) {
            errorRetryCountRef.current.wordDefinition = retryCount + 1
            const delay = Math.pow(2, retryCount) * 1000

            logger.info("WordDefinition", `Tentando novamente em ${delay}ms (tentativa ${retryCount + 1})`)

            setTimeout(() => {
              if (selectedWord) {
                fetchDefinition()
              }
            }, delay)
          } else {
            toast({
              title: "Erro ao buscar definição",
              description: "Não foi possível obter a definição após várias tentativas.",
              variant: "destructive",
            })
            errorRetryCountRef.current.wordDefinition = 0
          }
        } finally {
          updateProcessingState({ isLoadingDefinition: false })
        }
      } else {
        setWordDefinition(null)
        errorRetryCountRef.current.wordDefinition = 0
      }
    }

    fetchDefinition()
  }, [selectedWord, toast, updateProcessingState])

  // Initialize speech recognition
  useEffect(() => {
    const speechRecognition = speechRecognitionRef.current

    // Configure speech recognition
    speechRecognition.setOptions({
      language: speechLanguage === "pt-BR" ? "pt-BR" : "en-US",
      continuous: true,
      interimResults: true,
      timeout: 8000, // 8 seconds timeout for no-speech detection
      mode: chatMode,
    })

    // Update the stop-after-silence behavior based on auto-send setting
    speechRecognition.setShouldStopAfterSilence(autoSendAfterSilence)

    let lastSpeechTime = 0
    let noSpeechTimer: NodeJS.Timeout | null = null
    const silenceTimer: NodeJS.Timeout | null = null

    const resetNoSpeechTimer = () => {
      if (noSpeechTimer) clearTimeout(noSpeechTimer)
      noSpeechTimer = setTimeout(() => {
        if (Date.now() - lastSpeechTime > 8000) {
          speechRecognitionRef.current.triggerNoSpeechEvent()
        }
      }, 8000)
    }

    const stopSilenceTimer = () => {
      if (silenceTimer) clearTimeout(silenceTimer)
    }

    // Set up callbacks
    const callbacks = {
      onResult: (transcript, isFinal) => {
        logger.debug("SpeechRecognition", `Resultado: isFinal=${isFinal}, tamanho=${transcript.length}`)
        updateSpeechState({ noSpeechDetected: false })

        // Interromper a fala atual se o usuário começar a falar no modo de tempo real
        if (chatMode === "realtime" && processingState.isSpeaking) {
          interruptSpeechOnUserInput()
        }

        if (isFinal && chatMode === "realtime") {
          // In real-time mode, we process each final segment immediately
          logger.info("SpeechRecognition", `Transcrição final em tempo real: ${transcript.length} caracteres`)
          updateSpeechState({ interimTranscript: "" })
        } else {
          // For interim results or transcription mode
          updateSpeechState({ interimTranscript: transcript })
        }
      },
      onStart: () => {
        logger.info("SpeechRecognition", "Reconhecimento de fala iniciado")
        updateSpeechState({
          isRecording: true,
          noSpeechDetected: false,
        })
        listeningStartTimeRef.current = Date.now()

        // Start a timer to update the listening duration
        if (listeningTimerRef.current) {
          clearInterval(listeningTimerRef.current)
        }

        listeningTimerRef.current = setInterval(() => {
          if (listeningStartTimeRef.current) {
            const duration = Math.floor((Date.now() - listeningStartTimeRef.current) / 1000)
            updateSpeechState({ listeningDuration: duration })
          }
        }, 1000)
      },
      onEnd: () => {
        logger.info("SpeechRecognition", "Reconhecimento de fala finalizado")
        updateSpeechState({
          isRecording: false,
          interimTranscript: "",
          noSpeechDetected: false,
          listeningDuration: 0,
        })
        listeningStartTimeRef.current = null

        if (listeningTimerRef.current) {
          clearInterval(listeningTimerRef.current)
          listeningTimerRef.current = null
        }
      },
      onError: (error) => {
        if (error && error !== "no-speech") {
          logger.error("SpeechRecognition", `Erro de reconhecimento: ${error}`)
          toast({
            title: "Speech Recognition Error",
            description: error || "Failed to recognize speech",
            variant: "destructive",
          })
        }
      },
      onNoSpeech: () => {
        logger.warn("SpeechRecognition", "Nenhuma fala detectada")
        updateSpeechState({ noSpeechDetected: true })

        // Only show a notification if we're in transcription mode
        // In real-time mode, we want to keep listening
        if (chatMode === "transcription") {
          toast({
            title: "No speech detected",
            description: "Please speak into your microphone or try again.",
            variant: "default",
          })
        }
      },
      onSoundLevel: (level) => {
        // Não logamos níveis de som para evitar spam no console
        updateSpeechState({ microphoneLevel: level })
      },
      onSilence: () => {
        // Handle silence detection (useful for finalizing transcripts)
        logger.debug("SpeechRecognition", "Silêncio detectado")

        // In transcription mode with auto-send enabled, send the message after silence
        if (chatMode === "transcription" && autoSendAfterSilence && inputRef.current.trim()) {
          logger.info("Chat", "Agendando envio de mensagem após silêncio")

          // Limpar timeout anterior se existir
          if (transcriptionFinalizationTimeoutRef.current) {
            clearTimeout(transcriptionFinalizationTimeoutRef.current)
          }

          // Agendar envio com um delay maior para evitar cortes prematuros
          transcriptionFinalizationTimeoutRef.current = setTimeout(() => {
            if (inputRef.current.trim()) {
              logger.info("Chat", "Enviando mensagem automaticamente após silêncio confirmado")
              handleSendMessage()
            }
          }, 1500) // Delay de 1.5 segundos para confirmar o silêncio
        }
      },
      onFinalizeTranscript: (finalTranscript) => {
        logger.info("SpeechRecognition", `Transcrição finalizada: ${finalTranscript.length} caracteres`)

        if (chatMode === "realtime") {
          // In real-time mode, immediately process the transcript
          processRealTimeTranscript(finalTranscript)
        } else {
          // In transcription mode, set the input field
          setInput(finalTranscript)

          // If auto-send is enabled and we have content, send it
          if (autoSendAfterSilence && finalTranscript.trim()) {
            logger.info("Chat", "Agendando envio de transcrição finalizada")

            // Limpar timeout anterior se existir
            if (transcriptionFinalizationTimeoutRef.current) {
              clearTimeout(transcriptionFinalizationTimeoutRef.current)
            }

            // Agendar envio com um delay maior para evitar cortes prematuros
            transcriptionFinalizationTimeoutRef.current = setTimeout(() => {
              if (finalTranscript.trim()) {
                logger.info("Chat", "Enviando transcrição finalizada automaticamente")
                handleSendMessage(finalTranscript.trim())
              }
            }, 800) // Delay aumentado para 800ms
          }
        }
      },
      onSpeechStart: () => {
        logger.info("SpeechRecognition", "Fala do usuário iniciada")

        // Interromper a fala atual se o usuário começar a falar no modo de tempo real
        if (chatMode === "realtime" && processingState.isSpeaking) {
          interruptSpeechOnUserInput()
        }

        lastSpeechTime = Date.now()
        resetNoSpeechTimer()
        stopSilenceTimer() // Stop silence timer when speech starts
      },
    }

    speechRecognition.setCallbacks(callbacks)

    // Clean up on unmount
    return () => {
      if (speechRecognition.isActive()) {
        speechRecognition.stop()
      }

      if (listeningTimerRef.current) {
        clearInterval(listeningTimerRef.current)
      }
    }
  }, [
    speechLanguage,
    toast,
    chatMode,
    autoSendAfterSilence,
    updateSpeechState,
    processingState.isSpeaking,
    interruptSpeechOnUserInput,
  ])

  // Update the stop-after-silence behavior when autoSendAfterSilence changes
  useEffect(() => {
    const speechRecognition = speechRecognitionRef.current
    speechRecognition.setShouldStopAfterSilence(autoSendAfterSilence)
  }, [autoSendAfterSilence])

  // Process real-time transcript and get AI response
  const processRealTimeTranscript = async (transcript: string) => {
    if (!transcript.trim()) return

    // Interromper qualquer fala em andamento antes de processar nova entrada
    if (processingState.isSpeaking) {
      stopSpeaking()
      updateProcessingState({ isSpeaking: false })
    }

    // Verificar se é uma duplicação recente
    const now = Date.now()
    const timeSinceLastProcessed = now - lastProcessedTimestampRef.current

    // Evitar duplicações dentro da janela de tempo e verificar se o conteúdo é idêntico
    if (transcript === lastProcessedTranscript && timeSinceLastProcessed < duplicatePreventionTimeWindowMs) {
      logger.warn("Chat", `Ignorando transcrição duplicada (${timeSinceLastProcessed}ms desde a última)`)
      return
    }

    // Evitar processamento simultâneo
    if (processingQueueRef.current || processingState.isAutoResponding) {
      logger.warn("Chat", "Já existe um processamento em andamento, ignorando nova transcrição")
      return
    }

    // Marcar como em processamento
    processingQueueRef.current = true

    // Adicionar um pequeno atraso antes de processar para garantir que o usuário terminou de falar
    await new Promise((resolve) => setTimeout(resolve, 300))

    updateProcessingState({ isAutoResponding: true })

    // Atualizar o controle de duplicação
    setLastProcessedTranscript(transcript)
    lastProcessedTimestampRef.current = now

    // Adicionar mensagem do usuário
    const userMessage = {
      role: "user" as const,
      content: transcript,
      timestamp: new Date(),
    }

    logger.info("Chat", `Processando mensagem do usuário: ${transcript.length} caracteres`)
    setMessages((prev) => [...prev, userMessage])

    try {
      // Preparar histórico de conversa para contexto
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      logger.debug("Chat", `Enviando para API com ${conversationHistory.length} mensagens de contexto`)

      // Processar a entrada do aluno usando a API Gemini
      // Find where you're preparing the API request and add the environmentId
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory,
          environmentId: environment.id,
        }),
      })
      logger.info("Chat", `Resposta recebida da API: ${response.length} caracteres`)

      // Obter tradução se necessário
      let translation = undefined
      if (speechLanguage === "pt-BR") {
        try {
          logger.debug("Translation", "Traduzindo resposta para Português")
          translation = await translateWithGemini(response, "English", "Portuguese")
        } catch (error) {
          logger.error("Translation", `Erro de tradução: ${error}`)
          // Fallback: usar resposta sem tradução
          logger.info("Translation", "Usando resposta sem tradução como fallback")
        }
      }

      // Adicionar resposta do professor
      const teacherMessage = {
        role: "assistant" as const,
        content: response,
        translation,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, teacherMessage])

      // Atualizar vocabulário extraído
      try {
        logger.debug("Vocabulary", "Atualizando vocabulário extraído")
        updateExtractedVocabulary()
      } catch (error) {
        logger.error("Vocabulary", `Falha ao atualizar vocabulário: ${error}`)
        // Não é crítico, podemos continuar sem atualizar o vocabulário
      }

      // Usar o serviço TTS simplificado com a voz selecionada
      try {
        updateProcessingState({ isSpeaking: true })
        const currentAttempt = ++speakAttemptRef.current

        logger.info("TTS", `Sintetizando fala com voz ${avatarVoice} em ${speechLanguage}`)
        await speak(response, speechLanguage, avatarVoice)

        // Atualizar estado apenas se esta ainda for a tentativa atual de fala
        if (currentAttempt === speakAttemptRef.current) {
          updateProcessingState({ isSpeaking: false })
        }
      } catch (error) {
        logger.error("TTS", `Falha na síntese de fala: ${error}`)
        updateProcessingState({ isSpeaking: false })

        // Mostrar erro apenas para erros não relacionados a interrupções
        if (error instanceof Error && !error.message.includes("interrupted") && !error.message.includes("canceled")) {
          toast({
            title: "Erro de Fala",
            description: "Houve um problema com a síntese de fala.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      logger.error("Chat", `Erro no processamento da mensagem: ${error}`)

      // Implementar fallback para caso de falha na API
      const fallbackResponse = {
        role: "assistant" as const,
        content: "I'm sorry, I couldn't process your message at the moment. Could you please try again?",
        translation:
          speechLanguage === "pt-BR"
            ? "Desculpe, não consegui processar sua mensagem no momento. Poderia tentar novamente?"
            : undefined,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, fallbackResponse])

      toast({
        title: t("app.error"),
        description: "Falha ao processar sua mensagem. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      updateProcessingState({ isAutoResponding: false })
      processingQueueRef.current = false
      logger.debug("Chat", "Processamento de mensagem concluído")
    }
  }

  // Modify handleSendMessage to accept an optional parameter for direct transcript
  const handleSendMessage = async (directTranscript?: string) => {
    // Usar o valor do input atual ou o transcript direto fornecido
    const trimmedInput = directTranscript || inputRef.current.trim()
    if (!trimmedInput) return

    // Verificar se é uma duplicação recente
    const now = Date.now()
    const timeSinceLastProcessed = now - lastProcessedTimestampRef.current

    // Evitar duplicações dentro da janela de tempo e verificar se o conteúdo é idêntico
    if (trimmedInput === lastProcessedTranscript && timeSinceLastProcessed < duplicatePreventionTimeWindowMs) {
      logger.warn("Chat", `Ignorando mensagem duplicada (${timeSinceLastProcessed}ms desde a última)`)
      setInput("")
      return
    }

    // Evitar processamento simultâneo
    if (processingQueueRef.current || processingState.isProcessing) {
      logger.warn("Chat", "Já existe um processamento em andamento, ignorando nova mensagem")
      return
    }

    // Marcar como em processamento
    processingQueueRef.current = true
    updateProcessingState({ isProcessing: true })

    // Atualizar o controle de duplicação
    setLastProcessedTranscript(trimmedInput)
    lastProcessedTimestampRef.current = now

    // Adicionar mensagem do usuário
    const userMessage = {
      role: "user" as const,
      content: trimmedInput,
      timestamp: new Date(),
    }

    logger.info("Chat", `Enviando mensagem: ${trimmedInput.length} caracteres`)
    setMessages((prev) => [...prev, userMessage])

    // Limpar o input imediatamente para evitar duplicação visual
    setInput("")

    try {
      // Preparar histórico de conversa para contexto
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      logger.debug("Chat", `Enviando para API com ${conversationHistory.length} mensagens de contexto`)

      // Processar a entrada do aluno usando a API Gemini
      const response = await processStudentInputWithGemini(trimmedInput, conversationHistory)
      logger.info("Chat", `Resposta recebida da API: ${response.length} caracteres`)

      // Obter tradução se necessário
      let translation = undefined
      if (speechLanguage === "pt-BR") {
        try {
          logger.debug("Translation", "Traduzindo resposta para Português")
          translation = await translateWithGemini(response, "English", "Portuguese")
        } catch (error) {
          logger.error("Translation", `Erro de tradução: ${error}`)
          // Fallback: usar resposta sem tradução
          logger.info("Translation", "Usando resposta sem tradução como fallback")
        }
      }

      // Adicionar resposta do professor
      const teacherMessage = {
        role: "assistant" as const,
        content: response,
        translation,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, teacherMessage])

      // Atualizar vocabulário extraído
      try {
        logger.debug("Vocabulary", "Atualizando vocabulário extraído")
        updateExtractedVocabulary()
      } catch (error) {
        logger.error("Vocabulary", `Falha ao atualizar vocabulário: ${error}`)
        // Não é crítico, podemos continuar sem atualizar o vocabulário
      }

      // Usar o serviço TTS simplificado com a voz selecionada
      try {
        updateProcessingState({ isSpeaking: true })
        const currentAttempt = ++speakAttemptRef.current

        logger.info("TTS", `Sintetizando fala com voz ${avatarVoice} em ${speechLanguage}`)
        await speak(response, speechLanguage, avatarVoice)

        // Atualizar estado apenas se esta ainda for a tentativa atual de fala
        if (currentAttempt === speakAttemptRef.current) {
          updateProcessingState({ isSpeaking: false })
        }
      } catch (error) {
        logger.error("TTS", `Falha na síntese de fala: ${error}`)
        updateProcessingState({ isSpeaking: false })

        // Mostrar erro apenas para erros não relacionados a interrupções
        if (error instanceof Error && !error.message.includes("interrupted") && !error.message.includes("canceled")) {
          toast({
            title: "Erro de Fala",
            description: "Houve um problema com a síntese de fala.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      logger.error("Chat", `Erro no processamento da mensagem: ${error}`)

      // Implementar fallback para caso de falha na API
      const fallbackResponse = {
        role: "assistant" as const,
        content: "I'm sorry, I couldn't process your message at the moment. Could you please try again?",
        translation:
          speechLanguage === "pt-BR"
            ? "Desculpe, não consegui processar sua mensagem no momento. Poderia tentar novamente?"
            : undefined,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, fallbackResponse])

      toast({
        title: t("app.error"),
        description: "Falha ao processar sua mensagem. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      updateProcessingState({ isProcessing: false })
      processingQueueRef.current = false
      logger.debug("Chat", "Processamento de mensagem concluído")
    }
  }

  const toggleRecording = useCallback(() => {
    logger.info("SpeechRecognition", "Alternando gravação de voz")
    const speechRecognition = speechRecognitionRef.current
    const isActive = speechRecognition.toggle()
    logger.debug("SpeechRecognition", `Estado após alternância: ${isActive ? "ativo" : "inativo"}`)
  }, [])

  const handleWordClick = useCallback(
    (word: string) => {
      // Stop any ongoing speech when a word is clicked
      stopSpeaking()
      updateProcessingState({ isSpeaking: false })

      // If the same word is clicked again, clear the selection
      if (selectedWord === word) {
        logger.debug("WordDefinition", `Seleção de palavra removida: ${word}`)
        setSelectedWord(null)
      } else {
        logger.info("WordDefinition", `Palavra selecionada: ${word}`)
        setSelectedWord(word)
      }
    },
    [selectedWord, updateProcessingState],
  )

  // Add this function to clean text for display (not for speech)
  const cleanTextForDisplay = useCallback((text: string): string => {
    // This function ensures text is displayed properly without showing raw markdown or HTML
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markdown
      .replace(/\*(.*?)\*/g, "$1") // Remove italic markdown
      .replace(/`(.*?)`/g, "$1") // Remove code markdown
      .replace(/\[(.*?)\]$$(.*?)$$/g, "$1") // Replace markdown links with just the text
      .trim()
  }, [])

  // Update the renderMessageContent function to use the cleanTextForDisplay function
  const renderMessageContent = useCallback(
    (content: string, translation?: string) => {
      // Clean the content for display
      const cleanedContent = cleanTextForDisplay(content)

      // Split content into words and render each as clickable
      const words = cleanedContent.split(/\s+/)

      return (
        <div>
          <p className="mb-1 leading-relaxed">
            {words.map((word, index) => {
              // Remove punctuation for the word click but keep it for display
              const cleanWord = word.replace(/[.,!?;:'"()]/g, "")
              const punctuation = word.match(/[.,!?;:'"()]/g)

              return (
                <span key={index}>
                  {cleanWord && (
                    <span
                      className={`cursor-pointer hover:bg-indigo-100 rounded px-0.5 inline-block ${
                        selectedWord === cleanWord ? "bg-indigo-100" : ""
                      }`}
                      onClick={() => handleWordClick(cleanWord)}
                    >
                      {cleanWord}
                    </span>
                  )}
                  {punctuation && punctuation.join("")}
                  {index < words.length - 1 ? " " : ""}
                </span>
              )
            })}
          </p>
          {translation && <p className="text-gray-500 text-sm italic">{translation}</p>}
        </div>
      )
    },
    [cleanTextForDisplay, handleWordClick, selectedWord],
  )

  // Calculate the microphone animation styles based on the sound level
  const getMicAnimationStyle = useCallback(() => {
    const size = 40 + speechState.microphoneLevel * 0.6
    return {
      width: `${size}px`,
      height: `${size}px`,
      opacity: 0.3 + speechState.microphoneLevel * 0.007,
    }
  }, [speechState.microphoneLevel])

  // Handle chat mode change
  const handleChatModeChange = useCallback(
    (mode: ChatMode) => {
      // Stop current recording if active
      if (speechState.isRecording) {
        const speechRecognition = speechRecognitionRef.current
        speechRecognition.stop()
      }

      logger.info("Chat", `Modo de chat alterado para: ${mode}`)
      setChatMode(mode)

      // Clear interim transcript and input when changing modes
      updateSpeechState({ interimTranscript: "" })
      setInput("")

      // Reset processing state
      updateProcessingState({
        isProcessing: false,
        isAutoResponding: false,
        isSpeaking: false,
        isLoadingDefinition: false,
      })

      // Reset last processed transcript to prevent duplicate detection issues
      setLastProcessedTranscript("")
      lastProcessedTimestampRef.current = 0
      processingQueueRef.current = false

      // Wait a moment before starting with the new mode
      setTimeout(() => {
        // Update the speech recognition service with the new mode
        const speechRecognition = speechRecognitionRef.current
        speechRecognition.setMode(mode)
        speechRecognition.setShouldStopAfterSilence(autoSendAfterSilence && mode === "transcription")
      }, 500)
    },
    [speechState.isRecording, updateSpeechState, updateProcessingState, autoSendAfterSilence],
  )

  return (
    <div className="flex flex-col h-full">
      {/* Chat header with settings button */}
      <div className="flex justify-between items-center mb-4 sticky top-0 z-10 bg-white pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-indigo-700">{t("app.title")}</h2>
          {processingState.isSpeaking && (
            <div className="flex items-center text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
              <Volume2 className="h-3 w-3 mr-1 animate-pulse" />
              Speaking...
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-full p-0"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-4 w-4 text-gray-500" />
        </Button>
      </div>

      {/* Settings panel (collapsible) */}
      {showSettings && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-700">Configurações</h3>
          </div>

          {/* Chat mode selector in settings panel */}
          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-1">Modo de conversa:</div>
            <ChatModeSelector initialMode={chatMode} onModeChange={handleChatModeChange} />
          </div>

          {/* Auto-send toggle in settings panel */}
          <div className="relative flex items-center h-6">
            {chatMode === "transcription" && (
              <>
                <input
                  type="checkbox"
                  id="auto-send"
                  checked={autoSendAfterSilence}
                  onChange={(e) => setAutoSendAfterSilence(e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="auto-send" className="text-sm text-gray-600 cursor-pointer">
                  Enviar mensagem automaticamente após pausa na fala
                </label>
                <div
                  className="ml-1 cursor-help"
                  onMouseEnter={() => setShowAutoSendTooltip(true)}
                  onMouseLeave={() => setShowAutoSendTooltip(false)}
                >
                  <HelpCircle className="h-3.5 w-3.5 text-gray-500" />
                </div>
                {showAutoSendTooltip && (
                  <div className="absolute z-50 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg -top-2 right-0">
                    Quando ativado, sua mensagem será enviada automaticamente após uma pausa na fala.
                  </div>
                )}
              </>
            )}
            {chatMode !== "transcription" && (
              <div className="text-sm text-gray-500 italic">Opções adicionais não disponíveis no modo Tempo Real.</div>
            )}
          </div>
        </div>
      )}

      {/* Word definition panel */}
      <div
        className={`mb-4 p-4 bg-indigo-50 rounded-lg transition-all duration-200 ${selectedWord ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0 overflow-hidden p-0"}`}
      >
        {selectedWord && (
          <>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-indigo-800">{selectedWord}</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 rounded-full p-0"
                onClick={() => setSelectedWord(null)}
              >
                ×
              </Button>
            </div>
            {processingState.isLoadingDefinition ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                <span className="ml-2 text-sm text-indigo-600">Loading definition...</span>
              </div>
            ) : (
              <WordDefinition word={selectedWord} definition={wordDefinition} />
            )}
          </>
        )}
      </div>

      {/* Messages container */}
      <ScrollArea className="flex-1 pr-4 mb-4 overflow-y-auto">
        <div className="space-y-4 min-h-[200px]">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user" ? "bg-indigo-100 text-indigo-900" : "bg-gray-100 text-gray-800"
                }`}
              >
                {renderMessageContent(message.content, message.translation)}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Speech button (large, centered) - Fixed position when recording */}
      {speechState.isRecording && (
        <div className="mb-4 flex flex-col items-center">
          <div className="relative flex items-center justify-center mb-2">
            {/* Animated background circle */}
            <div
              className="absolute rounded-full bg-indigo-400 transition-all duration-200"
              style={getMicAnimationStyle()}
            ></div>

            {/* Microphone button */}
            <Button
              variant="default"
              size="lg"
              className={`relative z-10 h-14 w-14 rounded-full ${
                speechState.noSpeechDetected ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700"
              } flex items-center justify-center shadow-lg transition-colors duration-200 active:scale-95`}
              onClick={toggleRecording}
              aria-label="Stop voice recording"
            >
              <MicOff className="h-6 w-6 text-white" />
            </Button>
          </div>

          {/* Listening duration */}
          <div className="text-xs text-gray-500 mb-1">
            {speechState.listeningDuration > 0 && `Listening for ${speechState.listeningDuration}s`}
          </div>

          {/* Interim transcript */}
          <div className="text-center text-sm text-gray-600 max-w-md">
            {speechState.noSpeechDetected ? (
              <div className="flex items-center justify-center text-amber-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                <p>No speech detected. Please speak or click to stop.</p>
              </div>
            ) : speechState.interimTranscript ? (
              <p className="italic">{speechState.interimTranscript}</p>
            ) : (
              <p>Listening... Speak now</p>
            )}
          </div>
        </div>
      )}

      {/* Input area - only show in transcription mode or when not recording */}
      {(chatMode === "transcription" || !speechState.isRecording) && (
        <div className="relative mt-auto sticky bottom-0 bg-white pt-2 z-10">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder={speechState.isRecording ? "Listening..." : t("chat.placeholder")}
            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-24"
            disabled={processingState.isProcessing || speechState.isRecording}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            {!speechState.isRecording && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200 active:bg-indigo-100"
                onClick={toggleRecording}
                disabled={processingState.isProcessing}
                aria-label="Start voice recording"
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 rounded-full bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || processingState.isProcessing || speechState.isRecording}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Processing indicator - Fixed position */}
      {(processingState.isProcessing || processingState.isAutoResponding) && (
        <div className="text-center text-sm text-gray-500 mt-2 sticky bottom-16 z-10">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div
              className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}
