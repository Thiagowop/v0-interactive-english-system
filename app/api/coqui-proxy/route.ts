import { type NextRequest, NextResponse } from "next/server"

// This route acts as a proxy to the local Coqui TTS server
// It's useful when the frontend can't directly access the Coqui server
// due to CORS or network restrictions

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, language_id = 0 } = body

    if (!text) {
      return NextResponse.json({ error: "Text parameter is required" }, { status: 400 })
    }

    // Forward the request to the local Coqui TTS server
    // Adjust the URL if your Coqui server is running elsewhere
    const coquiResponse = await fetch("http://localhost:5002/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        speaker_id: null,
        style_wav: null,
        language_id,
      }),
    })

    if (!coquiResponse.ok) {
      throw new Error(`Coqui TTS request failed with status ${coquiResponse.status}`)
    }

    // Get the audio data as an ArrayBuffer
    const audioBuffer = await coquiResponse.arrayBuffer()

    // Return the audio data with the appropriate content type
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/wav",
      },
    })
  } catch (error) {
    console.error("Coqui proxy error:", error)
    return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 })
  }
}
