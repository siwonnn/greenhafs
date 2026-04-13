"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteRecordById, getAdminRecordsByMonth, type AdminRecord } from "@/app/actions"
import { formatSeoulDate } from "@/lib/date-utils"

interface AdminRecordsProps {
  initialYear: number
  initialMonth: number
  initialRecords: AdminRecord[]
}

function getMonthOptions() {
  return Array.from({ length: 12 }, (_, i) => i + 1)
}

const CLASS_OPTIONS = ["all", "1A", "1B", "2", "3", "4", "5", "6", "7", "8", "9", "10A", "10B"]

export function AdminRecords({ initialYear, initialMonth, initialRecords }: AdminRecordsProps) {
  const [year] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [records, setRecords] = useState<AdminRecord[]>(initialRecords)
  const [gradeFilter, setGradeFilter] = useState("all")
  const [classFilter, setClassFilter] = useState("all")
  const [recordIdToDelete, setRecordIdToDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const monthOptions = useMemo(() => getMonthOptions(), [])

  const refreshRecords = (targetMonth: number) => {
    setError(null)

    startTransition(async () => {
      const result = await getAdminRecordsByMonth(year, targetMonth)

      if (result.success) {
        setRecords(result.data ?? [])
        return
      }

      setError(result.error ?? "목록을 불러오는 중 오류가 발생했습니다.")
    })
  }

  const handleMonthChange = (value: string) => {
    const nextMonth = Number(value)
    setMonth(nextMonth)
    refreshRecords(nextMonth)
  }

  const handleDeleteConfirm = () => {
    if (!recordIdToDelete) {
      return
    }

    const targetRecordId = recordIdToDelete
    setError(null)

    startTransition(async () => {
      const result = await deleteRecordById(targetRecordId)

      if (!result.success) {
        setError(result.error ?? "삭제 중 오류가 발생했습니다.")
        return
      }

      setRecords((prev) => prev.filter((record) => record.id !== targetRecordId))
      setRecordIdToDelete(null)
    })
  }

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesGrade = gradeFilter === "all" || String(record.grade) === gradeFilter
      const matchesClass = classFilter === "all" || record.class === classFilter

      return matchesGrade && matchesClass
    })
  }, [records, gradeFilter, classFilter])

  useEffect(() => {
    if (initialRecords.length > 0) {
      return
    }

    refreshRecords(month)
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-5 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">기록 관리</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={String(month)} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="월 선택" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {m}월
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="학년" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 학년</SelectItem>
            <SelectItem value="1">1학년</SelectItem>
            <SelectItem value="2">2학년</SelectItem>
            <SelectItem value="3">3학년</SelectItem>
          </SelectContent>
        </Select>

        <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-36">
            <SelectValue placeholder="반 선택" />
            </SelectTrigger>
            <SelectContent>
            {CLASS_OPTIONS.map((classOption) => (
                <SelectItem key={classOption} value={classOption}>
                {classOption === "all" ? "전체 반" : `${classOption}반`}
                </SelectItem>
            ))}
            </SelectContent>
        </Select>
      </div>

      {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

      <div className="overflow-x-auto rounded-xl border bg-background">
        <div className="min-w-170">
          <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.7fr] gap-2 border-b bg-muted/40 px-4 py-3 text-xs font-semibold text-muted-foreground">
            <span>기록 시간</span>
            <span>학년/반</span>
            <span>조명</span>
            <span>프로젝터</span>
            <span>에어컨</span>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {isPending ? "불러오는 중..." : "조건에 맞는 기록이 없습니다."}
            </div>
          ) : (
            <div className="divide-y">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.7fr] items-center gap-2 px-4 py-3 text-sm"
                >
                  <span>{formatSeoulDate(record.created_at)}</span>
                  <span>{record.grade}학년 {record.class}반</span>
                  <span>{record.light_check ? "O" : "X"}</span>
                  <span>{record.projector_check ? "O" : "X"}</span>
                  <div className="flex items-center justify-between gap-2">
                    <span>{record.ac_check ? "O" : "X"}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRecordIdToDelete(record.id)}
                      disabled={isPending}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={recordIdToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRecordIdToDelete(null)
          }
        }}
      >
        <DialogContent showCloseButton={!isPending}>
          <DialogHeader>
            <DialogTitle>기록 삭제</DialogTitle>
            <DialogDescription>
                선택한 기록을 삭제할까요?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRecordIdToDelete(null)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isPending}>
              {isPending ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
