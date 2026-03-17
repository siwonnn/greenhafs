"use client"

import { useEffect, useState } from "react"
import { Download, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showIosTip, setShowIosTip] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(ua)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)

    setIsIos(iosDevice)
    setIsInstalled(isStandalone)

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      setShowIosTip(false)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const canShowInstall = Boolean(deferredPrompt) || isIos

  if (isInstalled || !canShowInstall) {
    return null
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
      return
    }

    if (isIos) {
      setShowIosTip((prev) => !prev)
    }
  }

  if (isIos && !deferredPrompt) {
    return (
      <TooltipProvider>
        <Tooltip open={showIosTip} onOpenChange={setShowIosTip}>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={handleInstallClick}>
              <Share className="size-3.5" />
              앱 설치
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" align="end" sideOffset={8} className="text-[10px] leading-relaxed">
            브라우저 메뉴에서 홈 화면에 추가를 선택하세요.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={handleInstallClick}>
      <Download className="size-3.5" />
      앱 설치
    </Button>
  )
}
