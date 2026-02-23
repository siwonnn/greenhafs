import Link from "next/link"
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

        <EnergyChecklistForm />
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-md items-center justify-between px-5">
          <p className="text-xs text-muted-foreground">
            {"GreenHAFS"}
          </p>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <BarChart3 className="size-3.5" />
            현황판
          </Link>
        </div>
      </footer>
    </div>
  )
}