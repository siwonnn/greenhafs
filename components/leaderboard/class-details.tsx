"use client"

import { CheckCircle, Info, XCircle } from "lucide-react"
import { formatSeoulDate } from "@/lib/date-utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ClassDetailsProps {
  classData: any
}

export function ClassDetails({ classData }: ClassDetailsProps) {
  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-2xl font-bold text-foreground mb-4">{classData.grade}학년 {classData.class}반</h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              총점
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center">
                      <Info className="size-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={6}>
                    제출 1회 3점 + 항목 1개 완료당 5점 + 완료율 보너스(최대 10점)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <span className="text-xl font-bold text-primary">{classData.score}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">제출 횟수</span>
            <span className="text-lg font-semibold text-foreground">{classData.totalSubmissions}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">완료율</span>
            <span className="text-lg font-semibold text-foreground">{classData.completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Records */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">최근 기록</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {classData.records.map((record: any, index: number) => (
            <div key={record.id} className="rounded-lg border border-border bg-card/50 p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-xs text-muted-foreground">{formatSeoulDate(record.submitted_at)}</p>
                <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-foreground">
                  #{classData.totalSubmissions - index}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {record.light_check ? (
                    <CheckCircle className="size-4 text-primary" />
                  ) : (
                    <XCircle className="size-4 text-destructive" />
                  )}
                  <span className="text-xs text-foreground">조명</span>
                </div>
                <div className="flex items-center gap-2">
                  {record.projector_check ? (
                    <CheckCircle className="size-4 text-primary" />
                  ) : (
                    <XCircle className="size-4 text-destructive" />
                  )}
                  <span className="text-xs text-foreground">프로젝터</span>
                </div>
                <div className="flex items-center gap-2">
                  {record.ac_check ? (
                    <CheckCircle className="size-4 text-primary" />
                  ) : (
                    <XCircle className="size-4 text-destructive" />
                  )}
                  <span className="text-xs text-foreground">에어컨/공기청정기</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
