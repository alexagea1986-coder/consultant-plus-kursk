"use client"

import { ReactNode } from "react"

interface MainLayoutProps {
  newsSidebar: ReactNode
  aiSearch: ReactNode
  additionalServices: ReactNode
}

export default function MainLayout({ newsSidebar, aiSearch, additionalServices }: MainLayoutProps) {
  return (
    <div className="bg-white min-h-screen">
      <div className="w-full max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <aside className="lg:col-span-4 order-1">
            {newsSidebar}
          </aside>
          <main className="lg:col-span-4 order-2">
            {aiSearch}
          </main>
          <aside className="lg:col-span-4 order-3">
            {additionalServices}
          </aside>
        </div>
      </div>
    </div>
  )
}