import { Leaf } from "lucide-react"

export function Header() {
  return (
    <header className="flex items-center justify-center gap-2.5 py-4">
      <div className="flex items-center justify-center rounded-xl bg-primary p-2">
        <Leaf className="size-5 text-primary-foreground" />
      </div>
      <div className="flex items-baseline gap-0.2">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Green
        </h1>
        <span className="text-xl font-bold tracking-tight text-primary">
          HAFS
        </span>
      </div>
    </header>
  )
}
