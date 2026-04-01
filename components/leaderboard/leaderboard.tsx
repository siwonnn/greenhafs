"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { getLeaderboardData } from "@/app/actions"
import { ClassRanking } from "@/components/leaderboard/class-ranking"
import { ClassDetails } from "@/components/leaderboard/class-details"
import { Header } from "@/components/header"

const MONTHS = [
  { value: "3", label: "3월" },
  { value: "4", label: "4월" },
  { value: "5", label: "5월" },
  { value: "6", label: "6월" },
  { value: "7", label: "7월" },
  { value: "8", label: "8월" },
  { value: "9", label: "9월" },
  { value: "10", label: "10월" },
  { value: "11", label: "11월" },
  { value: "12", label: "12월" },
]

interface LeaderboardProps {
  initialData: any[]
  initialYear: number
  initialMonth: number
}

function getCurrentSeoulMonth() {
  return Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      month: "2-digit",
    }).format(new Date())
  )
}

export function Leaderboard({ initialData, initialYear, initialMonth }: LeaderboardProps) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(String(initialMonth))
  const [maxVisibleMonth, setMaxVisibleMonth] = useState(initialMonth)
  const [selectedGrade, setSelectedGrade] = useState<number>(1)
  const [data, setData] = useState<any[]>(initialData)
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Filter months to only show up to current month
  const availableMonths = MONTHS.filter((m) => parseInt(m.value, 10) <= maxVisibleMonth)

  useEffect(() => {
    const currentMonth = getCurrentSeoulMonth()

    if (currentMonth <= initialMonth) {
      return
    }

    setMaxVisibleMonth(currentMonth)
    setMonth((prev) => {
      const parsed = parseInt(prev, 10)
      return Number.isNaN(parsed) || parsed < currentMonth ? String(currentMonth) : prev
    })
  }, [initialMonth])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const result = await getLeaderboardData(year, parseInt(month))
      if (result.success) {
        setData(result.data || [])
      }
      setLoading(false)
    }

    fetchData()
  }, [year, month])

  useEffect(() => {
    if (selectedClass && selectedClass.grade !== selectedGrade) {
      setSelectedClass(null)
    }
  }, [selectedClass, selectedGrade])

  const filteredData = data.filter((classData) => classData.grade === selectedGrade)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" />
            돌아가기
          </Link>
          <Header />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">에너지 절약 리더보드</h1>
          <p className="text-muted-foreground">반별 에너지 절약 기록 및 순위</p>
        </div>

        {/* Month / Grade Selector */}
        <div className="flex flex-col md:flex-row md:items-end">
          <div className="flex-1 max-w-xs">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">월</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">학년</label>
            <div className="flex gap-2">
              {[1, 2, 3].map((grade) => (
                <Button
                  key={grade}
                  type="button"
                  size="sm"
                  variant={selectedGrade === grade ? "default" : "outline"}
                  onClick={() => setSelectedGrade(grade)}
                >
                  {grade}학년
                </Button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">선택한 학년의 이 달 기록이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Rankings */}
            <div className="lg:col-span-2">
              <ClassRanking rankings={filteredData} selectedClass={selectedClass} onSelectClass={setSelectedClass} />
            </div>

            {/* Details Panel */}
            <div>
              {selectedClass ? (
                <ClassDetails classData={selectedClass} />
              ) : (
                <div className="rounded-xl border border-border bg-card p-6 text-center">
                  <p className="text-sm text-muted-foreground">반을 선택하여 자세한 기록을 확인하세요</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
