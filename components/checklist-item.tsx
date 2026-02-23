"use client"

import type { LucideIcon } from "lucide-react"
import { ChecklistSwitch } from "@/components/checklist-switch"

interface ChecklistItemProps {
  icon: LucideIcon
  label: string
  description: string
  checked: boolean
  onToggle: () => void
}

export function ChecklistItem({
  icon: Icon,
  label,
  description,
  checked,
  onToggle,
}: ChecklistItemProps) {
  return (
    <div className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left">
      <button
        type="button"
        onClick={onToggle}
        className="flex flex-1 min-w-0 gap-4 transition-all hover:opacity-75"
      >
        <div className="flex shrink-0 rounded-lg bg-muted p-2.5 text-muted-foreground">
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </button>
      <ChecklistSwitch checked={checked} onCheckedChange={() => onToggle()} />
    </div>
  )
}
