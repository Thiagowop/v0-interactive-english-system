import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const word = searchParams.get("word")

  if (!word) {
    return NextResponse.json({ error: "Word parameter is required" }, { status: 400 })
  }

  // In a real implementation, this would generate or fetch audio
  // For now, we'll return a mock response

  return NextResponse.json({
    word,
    audioUrl: `/audio/${word.toLowerCase()}.mp3`,
    // This would be a real audio URL in production
  })
}
