'use server'

import { supabase } from '@/lib/supabase'
import { getSeoulMonthRange } from '@/lib/date-utils'

interface ChecklistData {
  grade: string
  classNum: string
  light_check: boolean
  projector_check: boolean
  ac_check: boolean
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

export async function saveChecklistRecord(data: ChecklistData) {
  try {
    // Find the class by grade and class number
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('grade', parseInt(data.grade))
      .eq('class', data.classNum)
      .single()

    if (classError) {
      return {
        success: false,
        error: `Database error: ${classError.message}`
      }
    }

    if (!classData) {
      return {
        success: false,
        error: `Class not found for grade ${data.grade}, class ${data.classNum}`
      }
    }

    // Save the record with the class_id
    const { data: record, error: recordError } = await supabase
      .from('records')
      .insert([
        {
          class_id: classData.id,
          light_check: data.light_check,
          projector_check: data.projector_check,
          ac_check: data.ac_check,
        }
      ])
      .select()

    if (recordError) {
      return {
        success: false,
        error: recordError.message
      }
    }

    return {
      success: true,
      data: record
    }
  } catch (error) {
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
