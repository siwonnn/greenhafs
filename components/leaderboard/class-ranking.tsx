"use client"

import { Medal, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClassRankingProps {
  rankings: any[]
  selectedClass: any
  onSelectClass: (classData: any) => void
}

export function ClassRanking({ rankings, selectedClass, onSelectClass }: ClassRankingProps) {
  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇"
      case 2:
        return "🥈"
      case 3:
        return "🥉"
      default:
        return null
    }
  }

  // Calculate ranks with tie handling
  const rankedData = rankings.map((classData, index) => {
    let rank = 1
    for (let i = 0; i < index; i++) {
      if (rankings[i].score > classData.score) {
        rank++
      }
    }
    return { ...classData, rank }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">반 순위</h2>
      </div>

      <div className="space-y-2">
        {rankedData.map((classData) => {
          const medalIcon = getMedalIcon(classData.rank)

          return (
          <button
            key={classData.classId}
            onClick={() => onSelectClass(classData)}
            className={cn(
              "w-full text-left rounded-xl border-2 p-4 transition-all hover:border-primary/50",
              selectedClass?.classId === classData.classId
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:bg-accent/30"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={cn("font-bold min-w-12 text-center", medalIcon ? "text-4xl" : "text-2xl")}>
                  {medalIcon || `#${classData.rank}`}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {classData.grade}학년 {classData.class}반
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {classData.totalSubmissions}회 제출
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{classData.score}</p>
                <p className="text-xs text-muted-foreground">점</p>
              </div>
            </div>
          </button>
          )
        })}
      </div>
    </div>
  )
}
