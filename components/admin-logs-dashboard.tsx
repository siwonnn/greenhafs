'use client'

import { useState, useEffect } from 'react'
import { getLogsDashboardData, LogsDashboardData, LogsClassRow } from '@/app/actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ChevronUp, ChevronDown } from 'lucide-react'

type SortColumn = 'grade' | 'success' | 'cooldown' | 'timeRestricted' | 'blockRatio' | 'rank'
type SortDir = 'asc' | 'desc'

// Thresholds based on observed production data:
// daily: typical school day ~43–62, lighter days ~8–24
// weekly: full weeks ~259–281, moderate ~160, partial ~93–101
function getDotColorClass(count: number, isWeekly: boolean): string {
  if (isWeekly) {
    if (count === 0) return 'bg-gray-200'
    if (count <= 100) return 'bg-green-200'
    if (count <= 175) return 'bg-green-400'
    if (count <= 250) return 'bg-green-600'
    return 'bg-green-800'
  }
  if (count === 0) return 'bg-gray-200'
  if (count <= 20) return 'bg-green-200'
  if (count <= 40) return 'bg-green-400'
  if (count <= 55) return 'bg-green-600'
  return 'bg-green-800'
}

function getBlockRatioClass(ratio: number): string {
  if (ratio < 20) return 'text-green-600'
  if (ratio < 50) return 'text-orange-500'
  return 'text-red-500'
}

function formatMonthLabel(m: string): string {
  const parts = m.split('-')
  if (parts.length < 2) return m
  const [yr, mo] = parts
  return `${yr}년 ${Number(mo)}월`
}

function sortRows(rows: LogsClassRow[], col: SortColumn, dir: SortDir): LogsClassRow[] {
  return [...rows].sort((a, b) => {
    const mul = dir === 'asc' ? 1 : -1
    if (col === 'grade') {
      const gradeD = a.grade - b.grade
      if (gradeD !== 0) return mul * gradeD
      return mul * a.class.localeCompare(b.class)
    }
    return mul * (a[col] - b[col])
  })
}

function SortIcon({ col, sortCol, sortDir }: { col: SortColumn; sortCol: SortColumn; sortDir: SortDir }) {
  if (sortCol !== col) return <ChevronUp className="h-3 w-3 opacity-30" />
  return sortDir === 'asc'
    ? <ChevronUp className="h-3 w-3" />
    : <ChevronDown className="h-3 w-3" />
}

interface Props {
  initialYear: number
  initialMonth: number
}

export function AdminLogsDashboard({ initialYear, initialMonth }: Props) {
  const defaultMonth = `${initialYear}-${String(initialMonth).padStart(2, '0')}`
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth)
  const [data, setData] = useState<LogsDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortCol, setSortCol] = useState<SortColumn>('blockRatio')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    const month = selectedMonth === 'all' ? undefined : selectedMonth
    getLogsDashboardData(month)
      .then(result => {
        setData(result)
        setIsLoading(false)
      })
      .catch(() => {
        setError('데이터를 불러오지 못했습니다.')
        setIsLoading(false)
      })
  }, [selectedMonth])

  function handleSort(col: SortColumn) {
    if (sortCol === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  const sortedClasses = data ? sortRows(data.byClass, sortCol, sortDir) : []

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-5 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">로그 현황</h1>
      <div className="space-y-6">
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Month selector */}
      <div className="flex items-center gap-3">
        {data ? (
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 기간</SelectItem>
              {data.availableMonths.map(m => (
                <SelectItem key={m} value={m}>
                  {formatMonthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="h-9 w-44 rounded-md bg-muted animate-pulse" />
        )}
        {isLoading && data && <span className="text-sm text-muted-foreground">불러오는 중...</span>}
      </div>

      {/* KPI cards */}
      {data ? (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">총 성공 제출</p>
            <p className="mt-1 text-3xl font-bold text-green-600">{data.kpis.success.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">쿨다운 차단</p>
            <p className="mt-1 text-3xl font-bold text-red-500">{data.kpis.cooldown.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">시간 제한 차단</p>
            <p className="mt-1 text-3xl font-bold text-orange-500">{data.kpis.timeRestricted.toLocaleString()}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-lg border p-4">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="mt-2 h-8 w-16 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Dot chart */}
      <div className="rounded-lg border p-4">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          {data?.isWeekly ? '주별 제출 현황 (성공)' : '일별 제출 현황 (성공)'}
        </p>
        {data ? (
          <TooltipProvider>
            <div className="flex flex-wrap gap-1.5 items-center">
              {data.dots.map(dot => (
                <Tooltip key={dot.date}>
                  <TooltipTrigger asChild>
                    <div className={`w-3 h-3 rounded-full cursor-default ${getDotColorClass(dot.count, data.isWeekly)}`} />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {dot.label}: {dot.count}건
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-muted animate-pulse" />
            ))}
          </div>
        )}
        {data && (
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-gray-200" /> 0</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-200" /> 낮음</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-400" /> 보통</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-600" /> 활발</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-800" /> 매우 활발</span>
          </div>
        )}
      </div>

      {/* Class table */}
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {(
                [
                  { col: 'grade', label: '반' },
                  { col: 'success', label: '성공' },
                  { col: 'cooldown', label: '쿨다운 차단' },
                  { col: 'timeRestricted', label: '시간 제한 차단' },
                  { col: 'blockRatio', label: '차단비율' },
                ] as { col: SortColumn; label: string }[]
              ).map(({ col, label }) => (
                <th
                  key={col}
                  aria-sort={sortCol === col ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted select-none"
                  onClick={() => handleSort(col)}
                >
                  <span className="flex items-center gap-1">
                    {label}
                    <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
                  </span>
                </th>
              ))}
              <th
                aria-sort={sortCol === 'rank' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted select-none w-16"
                onClick={() => handleSort('rank')}
              >
                <span className="flex items-center gap-1">
                  순위
                  <SortIcon col="rank" sortCol={sortCol} sortDir={sortDir} />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {!data ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {[0, 1, 2, 3, 4, 5].map(j => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-12 rounded bg-muted animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedClasses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  데이터가 없습니다
                </td>
              </tr>
            ) : (
              sortedClasses.map(row => (
                <tr key={`${row.grade}-${row.class}`} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{row.grade}-{row.class}</td>
                  <td className="px-4 py-3 text-green-600">{row.success}</td>
                  <td className="px-4 py-3 text-red-500">{row.cooldown}</td>
                  <td className="px-4 py-3 text-orange-500">{row.timeRestricted}</td>
                  <td className={`px-4 py-3 font-medium ${getBlockRatioClass(row.blockRatio)}`}>
                    {row.blockRatio.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 font-medium text-muted-foreground">#{row.rank}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  )
}
