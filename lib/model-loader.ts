// This utility helps with loading and validating 3D models

/**
 * Validates if a URL returns a valid GLB/GLTF file
 * @param url The URL to validate
 * @returns Promise resolving to boolean indicating if the URL is valid
 */
export async function validateModelUrl(url: string): Promise<boolean> {
  try {
    // First check if the file exists with a HEAD request
    const headResponse = await fetch(url, { method: "HEAD" })

    if (!headResponse.ok) {
      console.error(`Model URL returned status ${headResponse.status}`)
      return false
    }

    // Check content type
    const contentType = headResponse.headers.get("content-type")
    if (
      contentType &&
      !contentType.includes("model/gltf-binary") &&
      !contentType.includes("model/gltf+json") &&
      !contentType.includes("application/octet-stream")
    ) {
      console.error(`Invalid content type: ${contentType}`)
      return false
    }

    return true
  } catch (error) {
    console.error("Error validating model URL:", error)
    return false
  }
}

/**
 * Preloads a 3D model to ensure it's in the browser cache
 * @param url The URL of the model to preload
 */
export async function preloadModel(url: string): Promise<void> {
  try {
    const isValid = await validateModelUrl(url)

    if (!isValid) {
      throw new Error(`Invalid model URL: ${url}`)
    }

    // Create a fetch request to preload the model
    await fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: "same-origin",
      priority: "high",
    })

    console.log(`Model preloaded: ${url}`)
  } catch (error) {
    console.error("Error preloading model:", error)
    throw error
  }
}

/**
 * Checks if WebGL is available and working in the current browser
 * @returns Object with status and message
 */
export function checkWebGLSupport(): { supported: boolean; message: string } {
  try {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")

    if (!gl) {
      return {
        supported: false,
        message: "WebGL is not supported in your browser. Please try a different browser.",
      }
    }

    return { supported: true, message: "WebGL is supported" }
  } catch (e) {
    return {
      supported: false,
      message: "Error checking WebGL support: " + (e instanceof Error ? e.message : String(e)),
    }
  }
}
