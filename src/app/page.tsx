"use client"

import { useState } from "react"
import Header from "@/components/sections/header"
import MainLayout from "@/components/sections/main-layout"
import NewsSidebar from "@/components/sections/news-sidebar"
import MainContentArea from "@/components/sections/main-content-area"
import AdditionalServices from "@/components/sections/additional-services"
import Footer from "@/components/sections/footer"

export default function Home() {
  const [anonymousLoggedIn, setAnonymousLoggedIn] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState("universal")

  const handleAnonymousLogin = () => {
    setAnonymousLoggedIn(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        anonymousLoggedIn={anonymousLoggedIn}
        onAnonymousLogin={handleAnonymousLogin}
        selectedProfile={selectedProfile}
        onProfileChange={setSelectedProfile}
      />
      
      <main className="flex-1">
        <MainLayout
          newsSidebar={<NewsSidebar 
            anonymousLoggedIn={anonymousLoggedIn} 
            selectedProfile={selectedProfile}
          />}
          aiSearch={
            <MainContentArea 
              anonymousLoggedIn={anonymousLoggedIn}
              onAnonymousLogin={handleAnonymousLogin}
              selectedProfile={selectedProfile}
            />
          }
          additionalServices={<AdditionalServices />}
        />
      </main>

      <Footer />
    </div>
  )
}