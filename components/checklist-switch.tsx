"use client"

import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"

interface ChecklistSwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function ChecklistSwitch({ checked, onCheckedChange }: ChecklistSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex shrink-0 items-center justify-between gap-0.75 rounded-lg border-2 p-0.75 transition-all",
        checked
          ? "border-primary bg-primary"
          : "border-destructive bg-destructive"
      )}
    >
      <div className={cn(
        "flex items-center justify-center px-0.75 py-1 rounded-sm transition-all",
        checked ? "text-green-400" : "text-red-500 bg-white"
      )}>
        <X className="size-3" strokeWidth={3} />
      </div>
      <div className={cn(
        "flex items-center justify-center px-0.75 py-1 rounded-sm transition-all",
        checked ? "text-green-500 bg-white" : "text-red-400"
      )}>
        <Check className="size-3" strokeWidth={3} />
      </div>
    </button>
  )
}
