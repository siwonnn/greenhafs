"use client"

import { useState, useTransition } from "react"
import { verifyAdminPassword } from "@/app/admin/auth-actions"
import { Button } from "@/components/ui/button"

interface AdminLoginFormProps {
  onSuccess: () => void
}

export function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await verifyAdminPassword(password)
      if (result.success) {
        onSuccess()
        setPassword("")
        return
      }

      setError(result.error ?? "비밀번호 확인 중 오류가 발생했습니다.")
    })
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md items-center px-5 py-10">
      <div className="w-full rounded-xl border bg-background p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">관리자 페이지</h1>
        <p className="mt-2 text-sm text-muted-foreground">접근을 위해 비밀번호를 입력해주세요.</p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <label htmlFor="admin-password" className="text-xs text-muted-foreground">
            비밀번호
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "확인 중..." : "입장"}
          </Button>
        </form>
      </div>
    </div>
  )
}
