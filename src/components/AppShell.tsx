'use client';

import { useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-[var(--color-primary-500)] to-[var(--color-secondary-500)] shadow-[0_0_15px_var(--color-primary-glow)]">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m11.3 5.7c.6-.6 1.4-.6 2 0l7 7c.6.6.6 1.4 0 2l-7 7c-.6.6-1.4.6-2 0l-7-7c-.6-.6-.6-1.4 0-2l7-7Z" />
          <path d="M7 11.5V11.5M11.5 7V7M11.5 17V17M17 11.5V11.5" />
          <path d="M2.5 12.5 11.5 3.5" />
        </svg>
      </div>
      <h1 className="text-lg font-bold tracking-tight">
        Court<span className="text-[var(--color-primary-500)]">Side</span>
      </h1>
    </div>
  );
}

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen md:flex">
      <div className="border-b border-[var(--color-surface-border)] bg-[var(--color-background)]/95 backdrop-blur md:hidden">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
          <BrandMark />
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={isMobileNavOpen}
            className="rounded-lg border border-[var(--color-surface-border)] bg-white/5 p-2 text-gray-200 transition-colors hover:bg-white/10"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      <div className="hidden md:block md:w-64 md:flex-shrink-0">
        <Sidebar className="h-screen w-64 flex-shrink-0" />
      </div>

      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={() => setIsMobileNavOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 md:hidden ${
          isMobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[calc(100vw-1rem)] transition-transform duration-200 md:hidden ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-[110%]'
        }`}
      >
        <div className="h-full py-2 pr-2">
          <div className="relative h-full">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              aria-label="Close navigation menu"
              className="absolute right-5 top-5 z-10 rounded-lg border border-[var(--color-surface-border)] bg-black/20 p-2 text-gray-200 transition-colors hover:bg-white/10"
            >
              <X size={18} />
            </button>
            <Sidebar className="h-full w-full rounded-r-3xl border-l-0 border-y-0" onNavigate={() => setIsMobileNavOpen(false)} />
          </div>
        </div>
      </div>

      <main className="relative min-w-0 flex-1 p-4 md:h-screen md:overflow-y-auto md:p-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
