'use client'

import { useState } from 'react'
import { AdminNav } from './AdminNav'
import { AdminAiAssistant } from './AdminAiAssistant'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-beige-light">
      <AdminNav collapsed={collapsed} onToggleCollapse={() => setCollapsed(c => !c)} />
      <div
        className={`transition-all duration-300 pt-[52px] lg:pt-0
          ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}
        `}
      >
        <main className="p-4 lg:p-8 min-h-screen">{children}</main>
      </div>
      <AdminAiAssistant />
    </div>
  )
}
