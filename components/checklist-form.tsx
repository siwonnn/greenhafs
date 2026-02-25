"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Lightbulb, Projector, AirVent } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChecklistItem } from "@/components/checklist-item"
import { SuccessView } from "@/components/success-view"
import { findClassId, saveChecklistRecord } from "@/app/actions"

const GRADES = ["1", "2", "3"]
const CLASSES = ["1A", "1B", "2", "3", "4", "5", "6", "7", "8", "9", "10A", "10B"]

interface ChecklistState {
  light: boolean
  projector: boolean
  ac: boolean
}

const STORAGE_KEY = "greenhafs_user_class"

export function EnergyChecklistForm() {
  const searchParams = useSearchParams()
  const [grade, setGrade] = useState("")
  const [classNum, setClassNum] = useState("")
  const [classId, setClassId] = useState("")
  const [checklist, setChecklist] = useState<ChecklistState>({
    light: false,
    projector: false,
    ac: false,
  })
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load grade and class from URL params or localStorage on mount
  useEffect(() => {
    const urlGrade = searchParams.get('grade')
    const urlClass = searchParams.get('class')
    
    if (urlGrade && GRADES.includes(urlGrade)) {
      setGrade(urlGrade)
    }
    if (urlClass && CLASSES.includes(urlClass)) {
      setClassNum(urlClass)
    }
    
    // If URL params are present, save to localStorage and return
    if (urlGrade || urlClass) {
      if (urlGrade && urlClass) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
          grade: urlGrade, 
          classNum: urlClass 
        }))
      }
      return
    }
    
    // Otherwise, load from localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const { grade: savedGrade, classNum: savedClass, classId: savedClassId } = JSON.parse(saved)
        if (savedGrade) setGrade(savedGrade)
        if (savedClass) setClassNum(savedClass)
        if (savedClassId) setClassId(savedClassId)
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [searchParams])

  // Save grade and class to localStorage whenever they change
  useEffect(() => {
    if (grade && classNum) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ grade, classNum, classId }))
    }
  }, [grade, classNum, classId])

  useEffect(() => {
    if (!grade || !classNum || classId) {
      return
    }

    let isCancelled = false

    const loadClassId = async () => {
      const result = await findClassId(grade, classNum)
      if (!isCancelled && result.success) {
        setClassId(result.classId)
      }
    }

    void loadClassId()

    return () => {
      isCancelled = true
    }
  }, [grade, classNum, classId])

  const handleGradeChange = (value: string) => {
    if (value !== grade) {
      setClassId("")
    }
    setGrade(value)
  }

  const handleClassChange = (value: string) => {
    if (value !== classNum) {
      setClassId("")
    }
    setClassNum(value)
  }

  const toggleItem = (key: keyof ChecklistState) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const isFormValid = grade !== "" && classNum !== ""

  const handleSubmit = async () => {
    if (!isFormValid) return
    
    setIsLoading(true)
    setError(null)

    try {
      const result = await saveChecklistRecord({
        grade,
        classNum,
        classId: classId || undefined,
        light_check: checklist.light,
        projector_check: checklist.projector,
        ac_check: checklist.ac,
      })

      if (result.success) {
        if ('classId' in result && result.classId) {
          setClassId(result.classId)
        }
        setSubmitted(true)
      } else {
        setError("제출 중 오류가 발생했습니다. " + result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? "제출 중 오류가 발생했습니다. " + err.message : "제출 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return <SuccessView grade={grade} classNum={classNum} />
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Grade & Class selection */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-semibold text-foreground">
            {"학년 / 반 선택"}
          </h2>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="grade" className="text-xs text-muted-foreground">
              학년
            </Label>
            <Select value={grade} onValueChange={handleGradeChange}>
              <SelectTrigger id="grade" className="w-full">
                <SelectValue placeholder="학년" />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="class" className="text-xs text-muted-foreground">
              반
            </Label>
            <Select value={classNum} onValueChange={handleClassChange}>
              <SelectTrigger id="class" className="w-full">
                <SelectValue placeholder="반" />
              </SelectTrigger>
              <SelectContent>
                {CLASSES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Checklist */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-semibold text-foreground">
            {"에너지 절약 체크리스트"}
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          <ChecklistItem
            icon={Lightbulb}
            label="조명"
            description="교실 조명이 모두 꺼져 있나요?"
            checked={checklist.light}
            onToggle={() => toggleItem("light")}
          />
          <ChecklistItem
            icon={Projector}
            label="프로젝터"
            description="프로젝터가 꺼져 있나요?"
            checked={checklist.projector}
            onToggle={() => toggleItem("projector")}
          />
          <ChecklistItem
            icon={AirVent}
            label="에어컨/공기청정기"
            description="에어컨과 공기청정기가 꺼져 있나요?"
            checked={checklist.ac}
            onToggle={() => toggleItem("ac")}
          />
        </div>
      </section>

      {/* Submit */}
      <div className="flex flex-col gap-3">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {isFormValid ? (
          <Button 
            onClick={handleSubmit} 
            size="lg" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "제출 중..." : "제출하기"}
          </Button>
        ) : (
          <Button disabled size="lg" className="w-full">
            {"학년과 반을 선택해주세요"}
          </Button>
        )}
        <p className="text-center text-xs text-muted-foreground">
          {"에너지 절약 실천 여부를 확인하여 사실대로 기록해주세요."}
        </p>
      </div>
    </div>
  )
}
