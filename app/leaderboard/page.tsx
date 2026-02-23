import { Leaderboard } from "@/components/leaderboard/leaderboard"
import { getLeaderboardData } from "@/app/actions"
import { getSeoulYearMonth } from "@/lib/date-utils"

export const metadata = {
  title: "에너지 절약 리더보드 | GreenHAFS",
  description: "반별 에너지 절약 실적 리더보드",
}

export default async function LeaderboardPage() {
  const { year, month } = getSeoulYearMonth()

  const initialData = await getLeaderboardData(year, month)

  return (
    <Leaderboard 
      initialData={initialData.success && initialData.data ? initialData.data : []} 
      initialYear={year}
      initialMonth={month}
    />
  )
}
