import { Dashboard } from "@/components/dashboard/dashboard"
import { getDashboardData } from "@/app/actions"
import { getSeoulYearMonth } from "@/lib/date-utils"

export const metadata = {
  title: "에너지 절약 현황판 | GreenHAFS",
  description: "반별 에너지 절약 실적 현황판",
}

export default async function DashboardPage() {
  const { year, month } = getSeoulYearMonth()

  const initialData = await getDashboardData(year, month)

  return (
    <Dashboard 
      initialData={initialData.success && initialData.data ? initialData.data : []} 
      initialYear={year}
      initialMonth={month}
    />
  )
}
