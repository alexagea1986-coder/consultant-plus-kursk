"use client"

import { useState } from "react"
import Header from "@/components/sections/header"
import MainLayout from "@/components/sections/main-layout"
import NewsSidebar from "@/components/sections/news-sidebar"
import MainContentArea from "@/components/sections/main-content-area"
import Footer from "@/components/sections/footer"

export default function Home() {
  const [anonymousLoggedIn, setAnonymousLoggedIn] = useState(true) // Always anonymous for student clone
  const [selectedProfile, setSelectedProfile] = useState("universal") // Fixed: Use value instead of label

  const handleAnonymousLogin = () => {
    setAnonymousLoggedIn(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header 
        anonymousLoggedIn={anonymousLoggedIn}
        onAnonymousLogin={handleAnonymousLogin}
      />
      
      <main className="flex-1">
        <MainLayout
          newsSidebar={<NewsSidebar 
            anonymousLoggedIn={anonymousLoggedIn} 
            selectedProfile={selectedProfile}
            onProfileChange={setSelectedProfile}
          />}
          mainContent={
            <MainContentArea 
              anonymousLoggedIn={anonymousLoggedIn}
              onAnonymousLogin={handleAnonymousLogin}
              selectedProfile={selectedProfile}
            />
          }
        />
      </main>

      <Footer />
    </div>
  )
}