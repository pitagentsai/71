import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Favicon } from "@/components/favicon"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "setteuno.com",
  description: "setteuno.com",
  generator: "v0.app",
  icons: {
    icon: "/favicon_2.png",
  },
  openGraph: {
    title: "setteuno.com",
    description: "setteuno.com",
    type: "website",
    images: [
      {
        url: "/api/og-image",
        width: 1200,
        height: 630,
        alt: "setteuno.com",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "setteuno.com",
    description: "setteuno.com",
    images: ["/api/og-image"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="overflow-hidden">
      <body className={`font-sans antialiased overflow-hidden`}>
        <Favicon />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
