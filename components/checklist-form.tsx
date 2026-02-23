"use client"

import { useState } from "react"
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
import { saveChecklistRecord } from "@/app/actions"

const GRADES = ["1", "2", "3"]
const CLASSES = ["1A", "1B", "2", "3", "4", "5", "6", "7", "8", "9", "10A", "10B"]

interface ChecklistState {
  light: boolean
  projector: boolean
  ac: boolean
}

export function EnergyChecklistForm() {
  const [grade, setGrade] = useState("")
  const [classNum, setClassNum] = useState("")
  const [checklist, setChecklist] = useState<ChecklistState>({
    light: false,
    projector: false,
    ac: false,
  })
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        light_check: checklist.light,
        projector_check: checklist.projector,
        ac_check: checklist.ac,
      })

      if (result.success) {
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
            <Select value={grade} onValueChange={setGrade}>
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
            <Select value={classNum} onValueChange={setClassNum}>
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
