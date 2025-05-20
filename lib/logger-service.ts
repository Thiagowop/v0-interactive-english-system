// Logger service for better debugging and log management

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal"

interface LoggerOptions {
  enabled: boolean
  minLevel: LogLevel
  maxLength: number
  showTimestamp: boolean
  persistLogs: boolean
  maxLogEntries: number
}

interface LogEntry {
  timestamp: number
  level: LogLevel
  category: string
  message: string
}

class LoggerService {
  private options: LoggerOptions = {
    enabled: true,
    minLevel: "info",
    maxLength: 200,
    showTimestamp: true,
    persistLogs: true,
    maxLogEntries: 1000,
  }

  private lastLogs: Record<string, { message: string; timestamp: number }> = {}
  private duplicateThreshold = 1000 // ms
  private logHistory: LogEntry[] = []
  private errorCount: Record<string, number> = {}
  private errorThresholds: Record<string, number> = {
    SpeechRecognition: 5,
    API: 3,
    TTS: 5,
  }
  private errorCallbacks: ((category: string, count: number) => void)[] = []

  constructor(options?: Partial<LoggerOptions>) {
    if (options) {
      this.options = { ...this.options, ...options }
    }

    // Enable more verbose logging in development
    if (
      (typeof window !== "undefined" && window.location.hostname === "localhost") ||
      window.location.hostname === "127.0.0.1"
    ) {
      this.options.minLevel = "debug"
    }

    // Recuperar logs persistentes do localStorage se disponível
    this.loadPersistedLogs()
  }

  private getLogLevelPriority(level: LogLevel): number {
    switch (level) {
      case "debug":
        return 0
      case "info":
        return 1
      case "warn":
        return 2
      case "error":
        return 3
      case "fatal":
        return 4
      default:
        return 1
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.options.enabled) return false
    return this.getLogLevelPriority(level) >= this.getLogLevelPriority(this.options.minLevel)
  }

  private formatMessage(category: string, message: string, level: LogLevel): string {
    let formattedMessage = ""

    if (this.options.showTimestamp) {
      const now = new Date()
      const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`
      formattedMessage += `[${timestamp}] `
    }

    formattedMessage += `[${category}] [${level.toUpperCase()}] `

    // Truncate long messages
    if (message.length > this.options.maxLength) {
      formattedMessage += `${message.substring(0, this.options.maxLength)}... (${message.length} chars)`
    } else {
      formattedMessage += message
    }

    return formattedMessage
  }

  private isDuplicate(category: string, message: string): boolean {
    const key = `${category}:${message}`
    const now = Date.now()
    const lastLog = this.lastLogs[key]

    if (lastLog && now - lastLog.timestamp < this.duplicateThreshold) {
      // Update timestamp but return true to indicate duplicate
      this.lastLogs[key] = { message, timestamp: now }
      return true
    }

    // Not a duplicate or outside threshold, update and return false
    this.lastLogs[key] = { message, timestamp: now }
    return false
  }

  private addToHistory(level: LogLevel, category: string, message: string) {
    // Adicionar ao histórico de logs
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message: message.length > this.options.maxLength ? message.substring(0, this.options.maxLength) + "..." : message,
    }

    this.logHistory.push(entry)

    // Limitar o tamanho do histórico
    if (this.logHistory.length > this.options.maxLogEntries) {
      this.logHistory = this.logHistory.slice(-this.options.maxLogEntries)
    }

    // Persistir logs se habilitado
    if (this.options.persistLogs) {
      this.persistLogs()
    }
  }

  private persistLogs() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        // Armazenar apenas os últimos 200 logs para não sobrecarregar o localStorage
        const logsToStore = this.logHistory.slice(-200)
        localStorage.setItem("app_logs", JSON.stringify(logsToStore))
      } catch (e) {
        // Ignorar erros de localStorage (ex: quota exceeded)
        console.warn("Failed to persist logs to localStorage", e)
      }
    }
  }

  private loadPersistedLogs() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const storedLogs = localStorage.getItem("app_logs")
        if (storedLogs) {
          const parsedLogs = JSON.parse(storedLogs) as LogEntry[]
          this.logHistory = parsedLogs
        }
      } catch (e) {
        console.warn("Failed to load persisted logs", e)
      }
    }
  }

  private trackError(category: string) {
    // Incrementar contador de erros para a categoria
    this.errorCount[category] = (this.errorCount[category] || 0) + 1

    // Verificar se atingiu o limite de erros
    const threshold = this.errorThresholds[category] || 10
    if (this.errorCount[category] >= threshold) {
      // Notificar sobre excesso de erros
      this.errorCallbacks.forEach((callback) => {
        try {
          callback(category, this.errorCount[category])
        } catch (e) {
          console.error("Error in error callback", e)
        }
      })

      // Resetar contador após notificação
      this.errorCount[category] = 0
    }
  }

  debug(category: string, message: string): void {
    if (!this.shouldLog("debug")) return
    if (this.isDuplicate(category, message)) return

    const formattedMessage = this.formatMessage(category, message, "debug")
    console.debug(formattedMessage)
    this.addToHistory("debug", category, message)
  }

  info(category: string, message: string): void {
    if (!this.shouldLog("info")) return
    if (this.isDuplicate(category, message)) return

    const formattedMessage = this.formatMessage(category, message, "info")
    console.info(formattedMessage)
    this.addToHistory("info", category, message)
  }

  warn(category: string, message: string): void {
    if (!this.shouldLog("warn")) return
    if (this.isDuplicate(category, message)) return

    const formattedMessage = this.formatMessage(category, message, "warn")
    console.warn(formattedMessage)
    this.addToHistory("warn", category, message)
  }

  error(category: string, message: string): void {
    if (!this.shouldLog("error")) return
    // Don't filter error duplicates - we want to see all errors

    const formattedMessage = this.formatMessage(category, message, "error")
    console.error(formattedMessage)
    this.addToHistory("error", category, message)

    // Rastrear erros para detecção de problemas recorrentes
    this.trackError(category)
  }

  fatal(category: string, message: string): void {
    if (!this.shouldLog("fatal")) return

    const formattedMessage = this.formatMessage(category, message, "fatal")
    console.error(formattedMessage)
    this.addToHistory("fatal", category, message)

    // Sempre rastrear erros fatais
    this.trackError(category)

    // Notificar imediatamente sobre erros fatais
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(category, -1) // -1 indica erro fatal
      } catch (e) {
        console.error("Error in error callback", e)
      }
    })
  }

  // Registrar callback para notificação de erros recorrentes
  onErrorThreshold(callback: (category: string, count: number) => void): void {
    this.errorCallbacks.push(callback)
  }

  // Obter logs filtrados
  getLogs(options?: {
    level?: LogLevel
    category?: string
    since?: number
    limit?: number
  }): LogEntry[] {
    let filteredLogs = [...this.logHistory]

    // Filtrar por nível
    if (options?.level) {
      const minPriority = this.getLogLevelPriority(options.level)
      filteredLogs = filteredLogs.filter((log) => this.getLogLevelPriority(log.level) >= minPriority)
    }

    // Filtrar por categoria
    if (options?.category) {
      filteredLogs = filteredLogs.filter((log) => log.category === options.category)
    }

    // Filtrar por timestamp
    if (options?.since) {
      filteredLogs = filteredLogs.filter((log) => log.timestamp >= options.since)
    }

    // Limitar quantidade
    if (options?.limit) {
      filteredLogs = filteredLogs.slice(-options.limit)
    }

    return filteredLogs
  }

  // Exportar logs para análise
  exportLogs(): string {
    return JSON.stringify(this.logHistory)
  }

  // Configure logger options at runtime
  configure(options: Partial<LoggerOptions>): void {
    this.options = { ...this.options, ...options }
  }

  // Enable/disable logging
  enable(enabled = true): void {
    this.options.enabled = enabled
  }

  // Set minimum log level
  setLevel(level: LogLevel): void {
    this.options.minLevel = level
  }

  // Limpar histórico de logs
  clearHistory(): void {
    this.logHistory = []
    if (this.options.persistLogs && typeof window !== "undefined") {
      localStorage.removeItem("app_logs")
    }
  }
}

// Create and export a singleton instance
const logger = new LoggerService()
export default logger
