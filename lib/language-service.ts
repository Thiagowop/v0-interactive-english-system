import { translateWithGemini, processStudentInputWithGemini, getWordDefinitionWithGemini } from "./gemini-service"

type Definition = {
  partOfSpeech: string
  definition: string
  example?: string
}

// Function to translate text between languages
export async function translateText(text: string, fromLang: string, toLang: string): Promise<string> {
  return translateWithGemini(text, fromLang, toLang)
}

// Function to process student input and generate teacher response
export async function processStudentInput(input: string): Promise<string> {
  return processStudentInputWithGemini(input)
}

// Function to get word definitions
export async function getWordDefinition(word: string): Promise<Definition[]> {
  return getWordDefinitionWithGemini(word)
}

// Function to get pronunciation audio URL (mock implementation)
export function getPronunciationUrl(word: string): string {
  // In a real implementation, this would call a pronunciation API
  // For now, we'll return a placeholder
  return `/api/pronunciation?word=${encodeURIComponent(word)}`
}
