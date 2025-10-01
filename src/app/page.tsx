"use client"

import { useState, useEffect } from "react"
import Header from "@/components/sections/header"
import MainLayout from "@/components/sections/main-layout"
import NewsSidebar from "@/components/sections/news-sidebar"
import MainContentArea from "@/components/sections/main-content-area"
import AdditionalServices from "@/components/sections/additional-services"
import Footer from "@/components/sections/footer"

export default function Home() {
  const [anonymousLoggedIn, setAnonymousLoggedIn] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState(() => {
    try {
      const ls = localStorage.getItem('selectedProfile');
      if (ls !== null) return ls;
    } catch {}

    try {
      const ss = sessionStorage.getItem('selectedProfile');
      if (ss !== null) return ss;
    } catch {}

    // Cookie fallback
    try {
      const cookies = document.cookie.split('; ').find(row => row.startsWith('selectedProfile='));
      if (cookies) {
        return decodeURIComponent(cookies.split('=')[1]);
      }
    } catch {}

    return "universal";
  })

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('selectedProfile', selectedProfile);
      return;
    } catch {}

    try {
      sessionStorage.setItem('selectedProfile', selectedProfile);
      return;
    } catch {}

    // Cookie fallback
    try {
      const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `selectedProfile=${encodeURIComponent(selectedProfile)}; path=/; expires=${expires}; SameSite=Strict`;
    } catch {}
  }, [selectedProfile]);

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