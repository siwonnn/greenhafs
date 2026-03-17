import Link from "next/link"
import { Suspense } from "react"
import { Header } from "@/components/header"
import { EnergyChecklistForm } from "@/components/checklist-form"
import { Button } from "@/components/ui/button"
import { BarChart3 } from "lucide-react"
import { PWAInstallButton } from "@/components/pwa-install-button"
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
          <div className="block">
            <p className="text-xs text-muted-foreground">
              {"기술지원: 20150최시원"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {"021325@hafs.hs.kr"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <Button variant="outline" size="sm" asChild>
              <Link href="/leaderboard" className="gap-1.5">
                <BarChart3 className="size-3.5" />
                리더보드
              </Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}