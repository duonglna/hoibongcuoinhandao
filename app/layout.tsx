import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pickleball Manager',
  description: 'Quản lý nhóm chơi pickleball',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}

