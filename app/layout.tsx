import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Roboto } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Favicon } from "@/components/favicon"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const roboto = Roboto({ 
  subsets: ["latin"], 
  weight: ["100", "300", "400", "500", "700"],
  variable: "--font-roboto"
})

export const metadata: Metadata = {
  title: "STRADA",
  description: "STRADA",
  generator: "v0.app",
  icons: {
    icon: "/strada-logo.png",
  },
  openGraph: {
    title: "STRADA",
    description: "STRADA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STRADA",
    description: "STRADA",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={roboto.variable}>
      <body className="font-sans antialiased">
        <Favicon />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
