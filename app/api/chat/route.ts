import { StreamingTextResponse, type Message } from "ai"
import { streamStudentInputWithGemini } from "@/lib/gemini-service"

export async function POST(req: Request) {
  try {
    // Extract the messages and environmentId from the request
    const { messages, environmentId = "casual" } = await req.json()

    // Get the chat history in the format expected by Gemini
    const chatHistory = messages
      .filter((m: Message) => m.role !== "system")
      .map((m: Message) => ({
        role: m.role,
        content: m.content,
      }))

    // Get the last user message
    const lastUserMessage = messages.filter((m: Message) => m.role === "user").pop()

    if (!lastUserMessage || !lastUserMessage.content) {
      return new Response("No user message found", { status: 400 })
    }

    // Generate the streaming response using Gemini with the environment ID
    try {
      const response = await streamStudentInputWithGemini(
        lastUserMessage.content,
        chatHistory.slice(0, -1), // Exclude the last message as it's passed separately
        environmentId,
      )

      // Return a streaming response
      return new StreamingTextResponse(response.textStream)
    } catch (error) {
      console.error("Error streaming response:", error)
      return new Response("Error processing your request", { status: 500 })
    }
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response("Error processing your request", { status: 500 })
  }
}
