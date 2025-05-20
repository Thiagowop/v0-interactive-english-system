// Serviço de fallback para APIs
import logger from "./logger-service"

type FallbackOptions = {
  maxRetries: number
  initialDelay: number
  backoffFactor: number
  maxDelay: number
  timeout?: number
}

const defaultOptions: FallbackOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffFactor: 1.5,
  maxDelay: 10000,
}

/**
 * Executa uma função com retry automático e backoff exponencial
 */
export async function withRetry<T>(fn: () => Promise<T>, options: Partial<FallbackOptions> = {}): Promise<T> {
  const config = { ...defaultOptions, ...options }
  let lastError: Error | null = null
  let delay = config.initialDelay

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Se não for a primeira tentativa, aguardar o delay
      if (attempt > 0) {
        logger.info("APIFallback", `Tentativa ${attempt}/${config.maxRetries} após ${delay}ms`)
        await new Promise((resolve) => setTimeout(resolve, delay))

        // Aumentar o delay para a próxima tentativa (backoff exponencial)
        delay = Math.min(delay * config.backoffFactor, config.maxDelay)
      }

      // Executar a função com timeout opcional
      if (config.timeout) {
        return await withTimeout(fn, config.timeout)
      } else {
        return await fn()
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      logger.error("APIFallback", `Tentativa ${attempt + 1} falhou: ${lastError.message}`)
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  throw lastError || new Error("Todas as tentativas falharam")
}

/**
 * Executa uma função com timeout
 */
export async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operação excedeu o timeout de ${timeoutMs}ms`))
    }, timeoutMs)

    fn()
      .then((result) => {
        clearTimeout(timeoutId)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

/**
 * Fornece uma resposta de fallback para quando todas as tentativas falharem
 */
export function withFallback<T>(fn: () => Promise<T>, fallbackValue: T): Promise<T> {
  return fn().catch((error) => {
    logger.warn("APIFallback", `Usando valor de fallback devido a erro: ${error.message}`)
    return fallbackValue
  })
}

/**
 * Respostas de fallback para diferentes tipos de conteúdo
 */
export const fallbackResponses = {
  chat: {
    en: "I'm sorry, I couldn't process your message at the moment. Could you please try again?",
    pt: "Desculpe, não consegui processar sua mensagem no momento. Poderia tentar novamente?",
  },
  translation: {
    en: "Translation unavailable",
    pt: "Tradução indisponível",
  },
  definition: {
    en: "Definition unavailable",
    pt: "Definição indisponível",
  },
}
