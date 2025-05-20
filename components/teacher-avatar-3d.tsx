"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment, Html } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"
import { speak, stopSpeaking } from "@/lib/simple-tts"

// Duck model component - using the built-in duck model from v0
function DuckModel() {
  const group = useRef()
  const { scene } = useGLTF("/assets/3d/duck.glb")

  return (
    <group ref={group}>
      <primitive object={scene} scale={2} position={[0, -1, 0]} rotation={[0, Math.PI / 4, 0]} />
    </group>
  )
}

export default function TeacherAvatar3D() {
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading the 3D model
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleSpeakClick = async () => {
    if (!speaking) {
      try {
        setSpeaking(true)
        await speak("Hello! I'm your English teacher. How can I help you today?", "en-US")
      } catch (error) {
        console.error("Failed to speak:", error)
      } finally {
        setSpeaking(false)
      }
    } else {
      stopSpeaking()
      setSpeaking(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="relative flex-1">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />

          {loading ? (
            <Html center>
              <div className="text-blue-500">Loading 3D model...</div>
            </Html>
          ) : (
            <DuckModel />
          )}

          <Environment preset="studio" />
          <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2} />
        </Canvas>
      </div>

      <div className="flex justify-center mt-4">
        <Button
          variant="outline"
          size="sm"
          className={`${speaking ? "bg-red-100" : "bg-blue-100"}`}
          onClick={handleSpeakClick}
        >
          {speaking ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Stop Speaking
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Speaking
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Preload the duck model
useGLTF.preload("/assets/3d/duck.glb")
