import { AdminPageClient } from "@/components/admin-page-client"
import { getSeoulYearMonth } from "@/lib/date-utils"

export const metadata = {
  title: "관리자 기록 관리 | GreenHAFS",
  description: "월별 기록 조회 및 삭제",
}

export default async function AdminPage() {
  const { year, month } = getSeoulYearMonth()

  return <AdminPageClient initialYear={year} initialMonth={month} />
}
