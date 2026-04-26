'use server'

import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { getSeoulMonthRange, getSeoulDateString, getSeoulMonthKey, isSeoulWeekend, isWithinSeoulSubmissionWindow } from '@/lib/date-utils'

interface ChecklistData {
  grade: string
  classNum: string
  classId?: string
  light_check: boolean
  projector_check: boolean
  ac_check: boolean
}

const SUBMISSION_COOLDOWN_MS = 30 * 60 * 1000

type SubmissionStatus = 'SUCCESS' | 'SUBMISSION_TIME_RESTRICTED' | 'COOLDOWN_ACTIVE' | 'ERROR'

export interface LogsDotPoint {
  label: string   // e.g. "4/13" for daily, "2026 W15" for weekly
  date: string    // "YYYY-MM-DD" (day or Monday of week)
  count: number
}

export interface LogsClassRow {
  grade: number
  class: string
  success: number
  cooldown: number
  timeRestricted: number
  blockRatio: number  // 0–100
  rank: number  // leaderboard rank within grade
  score: number  // leaderboard score
}

export interface LogsDashboardData {
  kpis: { success: number; cooldown: number; timeRestricted: number }
  dots: LogsDotPoint[]
  byClass: LogsClassRow[]
  availableMonths: string[]  // ["2026-04", "2026-03", ...] newest first
  isWeekly: boolean
}

interface SubmissionLogInput {
  class_id: string | null
  grade: number | null
  class: string | null
  ip: string | null
  user_agent: string | null
  status: SubmissionStatus
}

async function getRequestMetadata() {
  const requestHeaders = await headers()
  const forwardedFor = requestHeaders.get('x-forwarded-for')
  const realIp = requestHeaders.get('x-real-ip')

  return {
    ip: forwardedFor?.split(',')[0]?.trim() || realIp || null,
    userAgent: requestHeaders.get('user-agent') || null,
  }
}

async function insertSubmissionLog(payload: SubmissionLogInput) {
  // Logging should not block the main submission flow.
  const { error } = await supabase.from('logs').insert(payload)

  if (error) {
    console.error('Failed to insert submission log:', error.message)
  }
}

interface ClassRecord {
  id: string
  grade: number
  class: string
  submitted_at: string
  light_check: boolean
  projector_check: boolean
  ac_check: boolean
}

interface ClassScore {
  classId: string
  grade: number
  class: string
  totalSubmissions: number
  completionRate: number
  score: number
  records: ClassRecord[]
}

export interface AdminRecord {
  id: string
  created_at: string
  grade: number
  class: string
  light_check: boolean
  projector_check: boolean
  ac_check: boolean
}

export async function findClassId(grade: string, classNum: string) {
  try {
    const { data: classData, error } = await supabase
      .from('classes')
      .select('id')
      .eq('grade', parseInt(grade))
      .eq('class', classNum)
      .single()

    if (error) {
      return {
        success: false,
        error: `Database error: ${error.message}`
      }
    }

    if (!classData) {
      return {
        success: false,
        error: `Class not found for grade ${grade}, class ${classNum}`
      }
    }

    return {
      success: true,
      classId: classData.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function saveChecklistRecord(data: ChecklistData) {
  const parsedGrade = Number.parseInt(data.grade, 10)
  const gradeForLog = Number.isNaN(parsedGrade) ? null : parsedGrade
  const classForLog = data.classNum || null
  let classIdForLog: string | null = data.classId ?? null

  try {
    const { ip, userAgent } = await getRequestMetadata()

    if (isSeoulWeekend() || !isWithinSeoulSubmissionWindow()) {
      await insertSubmissionLog({
        class_id: classIdForLog,
        grade: gradeForLog,
        class: classForLog,
        ip,
        user_agent: userAgent,
        status: 'SUBMISSION_TIME_RESTRICTED',
      })

      return {
        success: false,
        error: '기록은 평일 08:50 ~ 23:30에만 가능합니다.',
        code: 'SUBMISSION_TIME_RESTRICTED',
      }
    }

    let classId = data.classId

    if (!classId) {
      // Find the class by grade and class number
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('grade', parseInt(data.grade))
        .eq('class', data.classNum)
        .single()

      if (classError) {
        await insertSubmissionLog({
          class_id: classIdForLog,
          grade: gradeForLog,
          class: classForLog,
          ip,
          user_agent: userAgent,
          status: 'ERROR',
        })

        return {
          success: false,
          error: `Database error: ${classError.message}`
        }
      }

      if (!classData) {
        await insertSubmissionLog({
          class_id: classIdForLog,
          grade: gradeForLog,
          class: classForLog,
          ip,
          user_agent: userAgent,
          status: 'ERROR',
        })

        return {
          success: false,
          error: `Class not found for grade ${data.grade}, class ${data.classNum}`
        }
      }

      classId = classData.id
    }

    classIdForLog = classId ?? null

    const cooldownThresholdIso = new Date(Date.now() - SUBMISSION_COOLDOWN_MS).toISOString()

    const { data: recentRecord, error: recentRecordError } = await supabase
      .from('records')
      .select('created_at')
      .eq('class_id', classId)
      .gte('created_at', cooldownThresholdIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recentRecordError) {
      await insertSubmissionLog({
        class_id: classIdForLog,
        grade: gradeForLog,
        class: classForLog,
        ip,
        user_agent: userAgent,
        status: 'ERROR',
      })

      return {
        success: false,
        error: `Database error: ${recentRecordError.message}`
      }
    }

    if (recentRecord?.created_at) {
      const submittedAtMs = new Date(recentRecord.created_at).getTime()
      const nextAllowedAtMs = submittedAtMs + SUBMISSION_COOLDOWN_MS
      const remainingMs = nextAllowedAtMs - Date.now()

      if (remainingMs > 0) {
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000))

        await insertSubmissionLog({
          class_id: classIdForLog,
          grade: gradeForLog,
          class: classForLog,
          ip,
          user_agent: userAgent,
          status: 'COOLDOWN_ACTIVE',
        })

        return {
          success: false,
          error: `마지막 기록 후 30분이 지나야 다시 기록할 수 있습니다. 약 ${remainingMinutes}분 후 다시 시도해주세요.`,
          code: 'COOLDOWN_ACTIVE',
          cooldownRemainingMinutes: remainingMinutes,
        }
      }
    }

    const { error: recordError } = await supabase
      .from('records')
      .insert({
        class_id: classId,
        light_check: data.light_check,
        projector_check: data.projector_check,
        ac_check: data.ac_check,
      })

    if (recordError) {
      await insertSubmissionLog({
        class_id: classIdForLog,
        grade: gradeForLog,
        class: classForLog,
        ip,
        user_agent: userAgent,
        status: 'ERROR',
      })

      return {
        success: false,
        error: recordError.message
      }
    }

    await insertSubmissionLog({
      class_id: classIdForLog,
      grade: gradeForLog,
      class: classForLog,
      ip,
      user_agent: userAgent,
      status: 'SUCCESS',
    })

    return {
      success: true,
      classId,
    }
  } catch (error) {
    const { ip, userAgent } = await getRequestMetadata()

    await insertSubmissionLog({
      class_id: classIdForLog,
      grade: gradeForLog,
      class: classForLog,
      ip,
      user_agent: userAgent,
      status: 'ERROR',
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function getLeaderboardData(year: number, month: number) {
  try {
    // Get the start and end dates for the month in Seoul timezone
    const { startDate, endDate } = getSeoulMonthRange(year, month)

    // Fetch all records for the month with class info
    const { data: records, error } = await supabase
      .from('records')
      .select(`
        id,
        class_id,
        light_check,
        projector_check,
        ac_check,
        created_at,
        classes(id, grade, class)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    // Group records by class and calculate scores
    const classMap = new Map<string, ClassScore>()

    records?.forEach((record: any) => {
      const classInfo = record.classes
      const key = classInfo.id

      if (!classMap.has(key)) {
        classMap.set(key, {
          classId: classInfo.id,
          grade: classInfo.grade,
          class: classInfo.class,
          totalSubmissions: 0,
          completionRate: 0,
          score: 0,
          records: []
        })
      }

      const classScore = classMap.get(key)!
      classScore.totalSubmissions++
      classScore.records.push({
        id: record.id,
        grade: classInfo.grade,
        class: classInfo.class,
        submitted_at: record.created_at,
        light_check: record.light_check,
        projector_check: record.projector_check,
        ac_check: record.ac_check,
      })
    })

    // Calculate scores and completion rates
    classMap.forEach((classScore) => {
      let totalChecks = 0
      let completedChecks = 0

      classScore.records.forEach((record) => {
        totalChecks += 3
        if (record.light_check) completedChecks++
        if (record.projector_check) completedChecks++
        if (record.ac_check) completedChecks++
      })

      classScore.completionRate = classScore.totalSubmissions > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0

      // Score calculation:
      // Base: 3 points per submission
      // Item: 5 points per completed check
      // Consistency bonus: extra points based on completion rate
      const baseScore = classScore.totalSubmissions * 3
      const itemScore = completedChecks * 5
      const consistencyBonus = Math.floor((classScore.completionRate / 100) * 10)

      classScore.score = baseScore + itemScore + consistencyBonus
    })

    // Sort by score
    const sortedClasses = Array.from(classMap.values()).sort((a, b) => b.score - a.score)

    return {
      success: true,
      data: sortedClasses
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function getAdminRecordsByMonth(year: number, month: number) {
  try {
    const { startDate, endDate } = getSeoulMonthRange(year, month)

    const { data, error } = await supabase
      .from('records')
      .select(`
        id,
        created_at,
        light_check,
        projector_check,
        ac_check,
        classes(grade, class)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    const records: AdminRecord[] = (data ?? [])
      .filter((row: any) => row.classes)
      .map((row: any) => ({
        id: row.id,
        created_at: row.created_at,
        grade: row.classes.grade,
        class: row.classes.class,
        light_check: row.light_check,
        projector_check: row.projector_check,
        ac_check: row.ac_check,
      }))

    return {
      success: true,
      data: records,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function deleteRecordById(recordId: string) {
  try {
    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', recordId)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function getLogsDashboardData(month?: string): Promise<LogsDashboardData> {
  // Fetch dashboard rows (filtered or all)
  let dataQuery = supabase
    .from('logs')
    .select('created_at, grade, class, status')
    .order('created_at', { ascending: true })

  if (month) {
    const [yr, mo] = month.split('-').map(Number)
    const { startDate, endDate } = getSeoulMonthRange(yr, mo)
    dataQuery = dataQuery.gte('created_at', startDate).lte('created_at', endDate)
  }

  let recordsQuery = supabase
    .from('records')
    .select('light_check, projector_check, ac_check, classes(grade, class)')

  if (month) {
    const [yr, mo] = month.split('-').map(Number)
    const { startDate, endDate } = getSeoulMonthRange(yr, mo)
    recordsQuery = recordsQuery.gte('created_at', startDate).lte('created_at', endDate)
  }

  const [{ data: logs, error: logsError }, { data: allTimestamps, error: tsError }, { data: records }] = await Promise.all([
    dataQuery,
    supabase.from('logs').select('created_at'),
    recordsQuery,
  ])

  if (logsError || !logs) throw new Error(logsError?.message ?? 'Failed to fetch logs')
  if (tsError) throw new Error(tsError.message)

  // Available months (derived from all rows)
  const monthSet = new Set<string>()
  for (const row of allTimestamps ?? []) {
    monthSet.add(getSeoulMonthKey(row.created_at))
  }
  const availableMonths = Array.from(monthSet).sort().reverse()

  // KPIs
  const kpis = { success: 0, cooldown: 0, timeRestricted: 0 }
  for (const log of logs) {
    if (log.status === 'SUCCESS') kpis.success++
    else if (log.status === 'COOLDOWN_ACTIVE') kpis.cooldown++
    else if (log.status === 'SUBMISSION_TIME_RESTRICTED') kpis.timeRestricted++
  }

  // Dot chart data
  const isWeekly = !month
  const dotMap = new Map<string, number>()

  for (const log of logs) {
    if (log.status !== 'SUCCESS') continue
    const dayStr = getSeoulDateString(log.created_at)

    let key: string
    if (isWeekly) {
      // Find Monday of this day's week
      const d = new Date(dayStr + 'T00:00:00Z')
      const dow = d.getUTCDay()
      const toMonday = dow === 0 ? 6 : dow - 1
      d.setUTCDate(d.getUTCDate() - toMonday)
      key = d.toISOString().slice(0, 10)
    } else {
      key = dayStr
    }
    dotMap.set(key, (dotMap.get(key) ?? 0) + 1)
  }

  let dots: LogsDotPoint[]

  if (month) {
    // Fill every calendar day of the month, including zeros
    const [yr, mo] = month.split('-').map(Number)
    const daysInMonth = new Date(yr, mo, 0).getDate()
    dots = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${yr}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      dots.push({ label: `${mo}/${d}`, date: dateStr, count: dotMap.get(dateStr) ?? 0 })
    }
  } else {
    // Weekly: only show weeks that have data, sorted ascending
    dots = Array.from(dotMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mondayStr, count]) => {
        const d = new Date(mondayStr + 'T00:00:00Z')
        const dayNum = d.getUTCDay() || 7
        const thursday = new Date(d)
        thursday.setUTCDate(d.getUTCDate() + 4 - dayNum)
        const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1))
        const weekNum = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
        return { label: `${thursday.getUTCFullYear()} W${weekNum}`, date: mondayStr, count }
      })
  }

  // Per-class aggregation from logs
  const classMap = new Map<string, Omit<LogsClassRow, 'rank' | 'score'>>()
  for (const log of logs) {
    if (log.status === 'ERROR') continue
    const key = `${log.grade}-${log.class}`
    if (!classMap.has(key)) {
      classMap.set(key, { grade: Number(log.grade), class: log.class, success: 0, cooldown: 0, timeRestricted: 0, blockRatio: 0 })
    }
    const row = classMap.get(key)!
    if (log.status === 'SUCCESS') row.success++
    else if (log.status === 'COOLDOWN_ACTIVE') row.cooldown++
    else if (log.status === 'SUBMISSION_TIME_RESTRICTED') row.timeRestricted++
  }

  // Compute leaderboard scores from records
  const scoreMap = new Map<string, { totalSubmissions: number; completedChecks: number; totalChecks: number }>()
  for (const record of records ?? []) {
    const clsRaw = record.classes
    const cls = clsRaw && !Array.isArray(clsRaw) ? clsRaw as { grade: number; class: string } : null
    if (!cls) continue
    const key = `${cls.grade}-${cls.class}`
    if (!scoreMap.has(key)) scoreMap.set(key, { totalSubmissions: 0, completedChecks: 0, totalChecks: 0 })
    const s = scoreMap.get(key)!
    s.totalSubmissions++
    s.totalChecks += 3
    if (record.light_check) s.completedChecks++
    if (record.projector_check) s.completedChecks++
    if (record.ac_check) s.completedChecks++
  }

  const getScore = (key: string) => {
    const s = scoreMap.get(key)
    if (!s || s.totalSubmissions === 0) return 0
    const completionRate = Math.round((s.completedChecks / s.totalChecks) * 100)
    return s.totalSubmissions * 3 + s.completedChecks * 5 + Math.floor((completionRate / 100) * 10)
  }

  // Compute per-grade ranks into a map, then attach immutably
  const scoreByKey = new Map<string, number>()
  for (const row of classMap.values()) {
    const key = `${row.grade}-${row.class}`
    scoreByKey.set(key, getScore(key))
  }

  const rankMap = new Map<string, number>()
  const gradeGroups = new Map<number, string[]>()
  for (const [key, row] of classMap) {
    const g = Number(row.grade)
    if (!gradeGroups.has(g)) gradeGroups.set(g, [])
    gradeGroups.get(g)!.push(key)
  }
  for (const keys of gradeGroups.values()) {
    keys.sort((a, b) => (scoreByKey.get(b) ?? 0) - (scoreByKey.get(a) ?? 0))
    keys.forEach((key, idx) => {
      let rank = 1
      for (let i = 0; i < idx; i++) {
        if ((scoreByKey.get(keys[i]) ?? 0) > (scoreByKey.get(key) ?? 0)) rank++
      }
      rankMap.set(key, rank)
    })
  }

  const byClass: LogsClassRow[] = Array.from(classMap.values()).map(row => {
    const total = row.success + row.cooldown + row.timeRestricted
    const key = `${row.grade}-${row.class}`
    return {
      ...row,
      blockRatio: total > 0 ? ((row.cooldown + row.timeRestricted) / total) * 100 : 0,
      score: scoreByKey.get(key) ?? 0,
      rank: rankMap.get(key) ?? 0,
    }
  }).sort((a, b) => a.grade - b.grade || a.class.localeCompare(b.class))

  return { kpis, dots, byClass, availableMonths, isWeekly }
}
