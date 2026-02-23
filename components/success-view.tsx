"use client"

import { CheckCircle2 } from "lucide-react"

interface SuccessViewProps {
  grade: string
  classNum: string
}

export function SuccessView({ grade, classNum }: SuccessViewProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex items-center justify-center rounded-full bg-primary/10 p-4">
        <CheckCircle2 className="size-10 text-primary" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          {"제출 완료"}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {grade}학년 {classNum}반 에너지 절약 체크리스트가 제출되었습니다.
        </p>
      </div>
    </div>
  )
}
