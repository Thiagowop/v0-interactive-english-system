"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SpeechPractice from "@/components/speech-practice"
import AISpeechPractice from "@/components/ai-speech-practice"
import { ChatProvider } from "@/contexts/chat-context"
import { AvatarProvider } from "@/contexts/avatar-context"
import Sidebar from "@/components/sidebar"

export default function SpeechPracticePage() {
  const [activeTab, setActiveTab] = useState<string>("ai-practice")

  return (
    <AvatarProvider>
      <ChatProvider>
        <main className="flex min-h-screen flex-col md:flex-row">
          <Sidebar />
          <div className="flex-1 p-4 md:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text mb-8">
                Interactive Speech Practice
              </h1>

              <Tabs defaultValue="ai-practice" value={activeTab} onValueChange={setActiveTab} className="mb-8">
                <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto">
                  <TabsTrigger value="ai-practice">AI Practice</TabsTrigger>
                  <TabsTrigger value="practice">Basic Practice</TabsTrigger>
                  <TabsTrigger value="lessons">Lessons</TabsTrigger>
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                </TabsList>

                <TabsContent value="ai-practice" className="mt-6">
                  <AISpeechPractice />
                </TabsContent>

                <TabsContent value="practice" className="mt-6">
                  <SpeechPractice targetLanguage="en-US" />
                </TabsContent>

                <TabsContent value="lessons" className="mt-6">
                  <Card className="border border-indigo-100">
                    <CardContent className="p-4 md:p-8 text-center">
                      <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Structured Lessons</h2>
                      <p className="text-gray-600 mb-4">
                        Follow guided lessons to improve your speaking skills systematically.
                      </p>
                      <p className="text-indigo-500">Coming soon!</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="progress" className="mt-6">
                  <Card className="border border-indigo-100">
                    <CardContent className="p-4 md:p-8 text-center">
                      <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Your Progress</h2>
                      <p className="text-gray-600 mb-4">
                        Track your speaking improvement over time with detailed analytics.
                      </p>
                      <p className="text-indigo-500">Coming soon!</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </ChatProvider>
    </AvatarProvider>
  )
}
