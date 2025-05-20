import { CONVERSATION_ENVIRONMENTS } from "@/contexts/environment-context"
import { GEMINI_API_KEY, SYSTEM_PROMPTS, validateGeminiConfig } from "./gemini-config"

// Função simples para processar a entrada do aluno
export async function processStudentInputWithGemini(
  input: string,
  previousMessages: { role: string; content: string }[] = [],
): Promise<string> {
  try {
    // Validar configuração
    if (!validateGeminiConfig()) {
      return "Desculpe, mas estou tendo problemas para me conectar ao meu modelo de linguagem. Por favor, tente novamente mais tarde."
    }

    console.log("Usando a chave API Gemini:", GEMINI_API_KEY.substring(0, 10) + "...")

    // Usar o modelo correto gemini-2.0-flash conforme o exemplo curl
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

    // Formatar mensagens anteriores para contexto
    const formattedMessages = previousMessages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }))

    // Preparar o conteúdo da requisição
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `${SYSTEM_PROMPTS.ENGLISH_TEACHER}\n\nUser message: ${input}\n\nIMPORTANT: Keep your response brief and concise. Match the length of your response to the complexity of the user's question. For simple questions or short phrases, provide short answers (1-3 sentences maximum).`,
          },
        ],
      },
    ]

    // Se houver mensagens anteriores, adicione-as ao contexto
    if (previousMessages.length > 0) {
      contents[0].parts[0].text = `${SYSTEM_PROMPTS.ENGLISH_TEACHER}\n\nPrevious conversation:\n${previousMessages.map((m) => `${m.role}: ${m.content}`).join("\n")}\n\nUser message: ${input}\n\nIMPORTANT: Keep your response brief and concise. Match the length of your response to the complexity of the user's question. For simple questions or short phrases, provide short answers (1-3 sentences maximum).`
    }

    const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Erro na API Gemini:", errorData)
      return "Desculpe, mas encontrei um erro ao processar sua mensagem. Por favor, tente novamente."
    }

    const data = await response.json()
    console.log("Resposta da API Gemini:", data)

    // Extrair o texto da resposta
    if (data.candidates && data.candidates[0]?.content?.parts && data.candidates[0].content.parts[0]?.text) {
      return data.candidates[0].content.parts[0].text
    }

    return "Desculpe, mas não consegui gerar uma resposta. Por favor, tente novamente."
  } catch (error) {
    console.error("Erro ao processar entrada do aluno com Gemini:", error)
    return "Desculpe, mas encontrei um erro ao processar sua mensagem. Por favor, tente novamente."
  }
}

// Função simples para traduzir texto
export async function translateWithGemini(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<string> {
  try {
    // Validar configuração
    if (!validateGeminiConfig()) {
      return "Tradução indisponível"
    }

    // Usar o modelo correto gemini-2.0-flash
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

    const prompt = `Traduza o seguinte texto de ${sourceLanguage} para ${targetLanguage}:\n\n"${text}"\n\nTradução:`

    const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Erro na API Gemini:", errorData)
      return "Tradução indisponível"
    }

    const data = await response.json()

    // Extrair o texto da resposta
    if (data.candidates && data.candidates[0]?.content?.parts && data.candidates[0].content.parts[0]?.text) {
      return data.candidates[0].content.parts[0].text
    }

    return "Tradução indisponível"
  } catch (error) {
    console.error("Erro ao traduzir com Gemini:", error)
    return "Tradução indisponível"
  }
}

// Função para obter definições de palavras
export async function getWordDefinitionWithGemini(word: string): Promise<any> {
  try {
    // Validar configuração
    if (!validateGeminiConfig()) {
      return { definition: "Gemini API key not configured." }
    }

    // Usar o modelo correto gemini-2.0-flash
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

    const prompt = `Forneça a definição da palavra "${word}" em inglês. Responda em formato JSON com os campos 'partOfSpeech' e 'definition'.`

    const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Erro na API Gemini:", errorData)
      return { definition: "Erro ao obter a definição da palavra." }
    }

    const data = await response.json()

    // Extrair o texto da resposta e tentar analisá-lo como JSON
    if (data.candidates && data.candidates[0]?.content?.parts && data.candidates[0].content.parts[0]?.text) {
      try {
        const definition = JSON.parse(data.candidates[0].content.parts[0].text)
        return definition
      } catch (e) {
        console.error("Erro ao analisar a resposta JSON:", e)
        return { definition: "Erro ao analisar a resposta do dicionário." }
      }
    }

    return { definition: "Definição não disponível." }
  } catch (error) {
    console.error("Erro ao obter a definição da palavra com Gemini:", error)
    return { definition: "Erro ao obter a definição da palavra." }
  }
}

// Função para analisar linguagem
export async function analyzeLanguageWithGemini(text: string, targetLanguage = "en-US"): Promise<any> {
  try {
    // Validar configuração
    if (!validateGeminiConfig()) {
      return { analysis: "Gemini API key not configured." }
    }

    // Usar o modelo correto gemini-2.0-flash
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

    const prompt = `Analise o seguinte texto em termos de gramática, vocabulário e fluência, e forneça feedback detalhado e sugestões de melhoria. O texto está em ${targetLanguage}:\n\n"${text}"`

    const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 30,
          topP: 0.8,
          maxOutputTokens: 1000,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Erro na API Gemini:", errorData)
      return { analysis: "Erro ao analisar o texto." }
    }

    const data = await response.json()

    // Extrair o texto da resposta
    if (data.candidates && data.candidates[0]?.content?.parts && data.candidates[0].content.parts[0]?.text) {
      return { analysis: data.candidates[0].content.parts[0].text }
    }

    return { analysis: "Análise não disponível." }
  } catch (error) {
    console.error("Erro ao analisar o texto com Gemini:", error)
    return { analysis: "Erro ao analisar o texto." }
  }
}

// Função para streaming (opcional, pode ser implementada posteriormente)
export async function streamStudentInputWithGemini(
  studentInput: string,
  chatHistory: any[] = [],
  environmentId = "casual",
): Promise<{ textStream: ReadableStream<string>; text: Promise<string> }> {
  try {
    // Validar configuração
    if (!validateGeminiConfig()) {
      throw new Error("Gemini API key not configured.")
    }

    // Find the environment by ID or use the default casual environment
    const environment =
      CONVERSATION_ENVIRONMENTS.find((env) => env.id === environmentId) || CONVERSATION_ENVIRONMENTS[0]

    // Use the environment's system prompt instead of the default
    const systemPrompt = environment.systemPrompt

    // Usar o modelo correto gemini-2.0-flash
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent"

    // Preparar o conteúdo da requisição
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `${systemPrompt}\n\nUser message: ${studentInput}\n\nIMPORTANT: Keep your response brief and concise. Match the length of your response to the complexity of the user's question. For simple questions or short phrases, provide short answers (1-3 sentences maximum).`,
          },
        ],
      },
    ]

    // Se houver mensagens anteriores, adicione-as ao contexto
    if (chatHistory.length > 0) {
      contents[0].parts[0].text = `${systemPrompt}\n\nPrevious conversation:\n${chatHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}\n\nUser message: ${studentInput}\n\nIMPORTANT: Keep your response brief and concise. Match the length of your response to the complexity of the user's question. For simple questions or short phrases, provide short answers (1-3 sentences maximum).`
    }

    const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Erro na API Gemini:", errorData)
      throw new Error("Failed to generate response from Gemini API")
    }

    let fullText = ""

    // Criar um ReadableStream para processar a resposta
    const textStream = new ReadableStream<string>({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.error("ReadableStream not supported")
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              controller.close()
              break
            }

            // Processar cada chunk de dados
            const textDecoder = new TextDecoder()
            const chunk = textDecoder.decode(value)

            try {
              const jsonChunk = JSON.parse(chunk)
              if (
                jsonChunk.candidates &&
                jsonChunk.candidates[0]?.content?.parts &&
                jsonChunk.candidates[0].content.parts[0]?.text
              ) {
                const text = jsonChunk.candidates[0].content.parts[0].text
                fullText += text
                controller.enqueue(text)
              }
            } catch (e) {
              console.log("Error parsing chunk", chunk)
            }
          }
        } catch (error) {
          console.error("Erro ao ler o stream:", error)
          controller.error(error)
        }
      },
    })

    return { textStream, text: Promise.resolve(fullText) }
  } catch (error) {
    console.error("Erro ao processar entrada do aluno com Gemini:", error)
    throw error
  }
}
