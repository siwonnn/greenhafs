"use client"

import { useState } from "react"
import { AdminLoginForm } from "@/components/admin-login-form"
import { AdminRecords } from "@/components/admin-records"

interface AdminPageClientProps {
  initialYear: number
  initialMonth: number
}

export function AdminPageClient({ initialYear, initialMonth }: AdminPageClientProps) {
  const [isUnlocked, setIsUnlocked] = useState(false)

  if (!isUnlocked) {
    return <AdminLoginForm onSuccess={() => setIsUnlocked(true)} />
  }

  return <AdminRecords initialYear={initialYear} initialMonth={initialMonth} initialRecords={[]} />
}
