import { type NextRequest, NextResponse } from "next/server"

// This API route checks if a 3D model file exists and is valid
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const modelUrl = searchParams.get("url")

  if (!modelUrl) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
  }

  try {
    // Make a HEAD request to check if the file exists
    const response = await fetch(modelUrl, {
      method: "HEAD",
      headers: {
        // Add origin to help with CORS
        Origin: request.headers.get("host") || "localhost",
      },
    })

    if (!response.ok) {
      return NextResponse.json({
        valid: false,
        status: response.status,
        statusText: response.statusText,
        message: `Model file returned status ${response.status}`,
      })
    }

    // Check content type if available
    const contentType = response.headers.get("content-type")
    const isValidType =
      !contentType ||
      contentType.includes("model/gltf") ||
      contentType.includes("model/gltf-binary") ||
      contentType.includes("application/octet-stream")

    return NextResponse.json({
      valid: isValidType,
      contentType,
      message: isValidType ? "Model appears to be valid" : "Invalid content type for 3D model",
    })
  } catch (error) {
    console.error("Error checking model:", error)
    return NextResponse.json({
      valid: false,
      message: error instanceof Error ? error.message : "Unknown error checking model",
    })
  }
}
