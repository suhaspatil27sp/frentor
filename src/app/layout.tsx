import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Tutor Chat',
  description: 'Your personal AI tutoring assistant for interactive learning',
  keywords: ['AI tutor', 'education', 'learning', 'chat', 'tutoring'],
  authors: [{ name: 'Your Name' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#6366f1',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}