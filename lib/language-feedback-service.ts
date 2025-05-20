// Language Feedback Service for analyzing speech and providing corrections

import { analyzeLanguageWithGemini } from "./gemini-service"

export type FeedbackType = "pronunciation" | "grammar" | "vocabulary" | "fluency"

export interface LanguageFeedback {
  type: FeedbackType
  originalText: string
  correctedText?: string
  explanation: string
  severity: "minor" | "moderate" | "major"
}

export interface FeedbackResult {
  feedback: LanguageFeedback[]
  overallScore?: number
  strengths?: string[]
  suggestions?: string[]
}

// Function to analyze text and provide language feedback
export async function analyzeLanguage(text: string, targetLanguage = "en-US"): Promise<FeedbackResult> {
  return analyzeLanguageWithGemini(text, targetLanguage)
}

// Function to provide simple, immediate feedback without AI
// This is useful for quick feedback when AI might be too slow
export function getQuickFeedback(text: string): FeedbackResult {
  const feedback: LanguageFeedback[] = []
  const lowerText = text.toLowerCase()

  // Simple pattern matching for common English errors
  if (lowerText.includes("i am go")) {
    feedback.push({
      type: "grammar",
      originalText: "I am go",
      correctedText: "I am going",
      explanation: "Use the present continuous tense (am + verb-ing) for actions happening now.",
      severity: "moderate",
    })
  }

  if (lowerText.includes("yesterday i go")) {
    feedback.push({
      type: "grammar",
      originalText: "yesterday I go",
      correctedText: "yesterday I went",
      explanation: "Use the past tense for actions that happened in the past.",
      severity: "moderate",
    })
  }

  // Check for missing articles
  const noArticlePatterns = [
    {
      pattern: /\bi am (\w+) student\b/i,
      correction: "I am a student",
      explanation: "Use the article 'a' before singular countable nouns.",
    },
    {
      pattern: /\bthis is (\w+) book\b/i,
      correction: "This is a book",
      explanation: "Use the article 'a' before singular countable nouns.",
    },
  ]

  noArticlePatterns.forEach(({ pattern, correction, explanation }) => {
    if (pattern.test(text)) {
      feedback.push({
        type: "grammar",
        originalText: text.match(pattern)?.[0] || "",
        correctedText: correction,
        explanation,
        severity: "minor",
      })
    }
  })

  return {
    feedback,
    overallScore: feedback.length === 0 ? 100 : Math.max(70, 100 - feedback.length * 10),
    strengths: feedback.length === 0 ? ["Good job! No obvious errors detected."] : [],
    suggestions: feedback.length === 0 ? [] : ["Pay attention to grammar rules."],
  }
}
