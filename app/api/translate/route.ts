import { type NextRequest, NextResponse } from "next/server"
import { translateText } from "@/lib/language-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, fromLang, toLang } = body

    if (!text || !fromLang || !toLang) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const translatedText = await translateText(text, fromLang, toLang)

    return NextResponse.json({
      original: text,
      translated: translatedText,
      fromLang,
      toLang,
    })
  } catch (error) {
    console.error("Translation API error:", error)
    return NextResponse.json({ error: "Failed to process translation" }, { status: 500 })
  }
}
