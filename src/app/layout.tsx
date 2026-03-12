import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Badminton Coach Manager',
  description: 'Manage students, sessions, and payments for your badminton coaching.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[var(--color-background)] text-[var(--color-foreground)] min-h-screen flex`}>
        {/* Navigation Sidebar */}
        <Sidebar className="w-64 flex-shrink-0" />
        
        {/* Main Content Area */}
        <main className="flex-1 p-8 h-screen overflow-y-auto w-full relative">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
