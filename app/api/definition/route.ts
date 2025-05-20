import { type NextRequest, NextResponse } from "next/server"
import { getWordDefinition } from "@/lib/language-service"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const word = searchParams.get("word")

  if (!word) {
    return NextResponse.json({ error: "Word parameter is required" }, { status: 400 })
  }

  try {
    const definitions = await getWordDefinition(word)

    return NextResponse.json({
      word,
      definitions,
    })
  } catch (error) {
    console.error("Definition API error:", error)
    return NextResponse.json({ error: "Failed to fetch definition" }, { status: 500 })
  }
}
