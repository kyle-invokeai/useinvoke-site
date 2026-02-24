import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Invoke - AI-Powered Communication Infrastructure',
  description: 'Automate voice and messaging workflows with intelligent systems.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-200 antialiased">{children}</body>
    </html>
  )
}
