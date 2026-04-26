'use client'

import { useState } from 'react'
import { AdminLoginForm } from '@/components/admin-login-form'
import { AdminRecords } from '@/components/admin-records'
import { AdminLogsDashboard } from '@/components/admin-logs-dashboard'

type Tab = 'records' | 'logs'

const TABS: { id: Tab; label: string }[] = [
  { id: 'records', label: '기록' },
  { id: 'logs', label: '로그' },
]

interface AdminPageClientProps {
  initialYear: number
  initialMonth: number
}

export function AdminPageClient({ initialYear, initialMonth }: AdminPageClientProps) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('records')

  if (!isUnlocked) {
    return <AdminLoginForm onSuccess={() => setIsUnlocked(true)} />
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="border-b">
      <div className="mx-auto flex w-full max-w-4xl px-5">
      <div className="flex">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      </div>
      </div>

      {/* Tab content */}
      {activeTab === 'records' ? (
        <AdminRecords initialYear={initialYear} initialMonth={initialMonth} initialRecords={[]} />
      ) : (
        <AdminLogsDashboard initialYear={initialYear} initialMonth={initialMonth} />
      )}
    </div>
  )
}
