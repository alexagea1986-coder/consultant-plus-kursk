"use client"

import { ReactNode } from "react"

interface MainLayoutProps {
  newsSidebar: ReactNode
  mainContent: ReactNode
}

export default function MainLayout({ newsSidebar, mainContent }: MainLayoutProps) {
  return (
    <div className="bg-white min-h-screen">
      <div className="w-full max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <aside className="lg:col-span-5 order-2 lg:order-1">
            {newsSidebar}
          </aside>
          <main className="lg:col-span-7 order-1 lg:order-2">
            {mainContent}
          </main>
        </div>
      </div>
    </div>
  )
}