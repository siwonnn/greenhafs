import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { PostHogProvider } from "./providers"
import { PostHogPageView } from "./PostHogPageView"
import { Suspense } from "react"
import { PWARegisterSW } from "@/components/pwa-register-sw"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GreenHAFS",
  description: "외대부고 에너지 절약 캠페인",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "GreenHAFS",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "GreenHAFS",
    description: "외대부고 에너지 절약 캠페인",
    url: "https://green.hafs.hs.kr",
    siteName: "GreenHAFS",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f9b68",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script defer src="https://cloud.umami.is/script.js" data-website-id="608a66e3-603e-4f11-976d-049ccee548ab"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PostHogProvider>
          <PWARegisterSW />
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <Analytics />
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
