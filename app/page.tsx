import Link from "next/link"
import { Suspense } from "react"
import { Header } from "@/components/header"
import { EnergyChecklistForm } from "@/components/checklist-form"
import { BarChart3 } from "lucide-react"
export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10">
        <Header />

        <div className="flex flex-col gap-2 mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            {"에너지 절약,"}
            <br />
            {"작은 실천이 큰 변화를 만듭니다."}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {"이동수업 전 에너지 절약 체크리스트를 완료해주세요."}
          </p>
        </div>

        <Suspense fallback={<div className="text-center text-muted-foreground">로딩 중...</div>}>
          <EnergyChecklistForm />
        </Suspense>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-md items-center justify-between px-5">
          <p className="text-xs text-muted-foreground">
            {"문의: 20150최시원"}
            <br />
            {"021325@hafs.hs.kr"}
          </p>
          <Link 
            href="/leaderboard" 
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <BarChart3 className="size-3.5" />
            리더보드
          </Link>
        </div>
      </footer>
    </div>
  )
}