import { Inter } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/AppShell'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Badminton Coach Manager',
  description: 'Manage students, sessions, and payments for your badminton coaching.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[var(--color-background)] text-[var(--color-foreground)] min-h-screen`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
