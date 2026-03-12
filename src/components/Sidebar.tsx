'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CalendarDays, Wallet, Settings } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Sessions', href: '/sessions', icon: CalendarDays },
  { name: 'Payments', href: '/payments', icon: Wallet },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`glass-panel border-l-0 border-y-0 border-r border-[var(--color-surface-border)] rounded-none h-screen flex flex-col ${className}`}>
      {/* Brand */}
      <div className="p-6 border-b border-[var(--color-surface-border)] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--color-primary-500)] to-[var(--color-secondary-500)] flex items-center justify-center shadow-[0_0_15px_var(--color-primary-glow)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m11.3 5.7c.6-.6 1.4-.6 2 0l7 7c.6.6.6 1.4 0 2l-7 7c-.6.6-1.4.6-2 0l-7-7c-.6-.6-.6-1.4 0-2l7-7Z"/>
            <path d="M7 11.5V11.5M11.5 7V7M11.5 17V17M17 11.5V11.5"/>
            <path d="M2.5 12.5 11.5 3.5"/>
          </svg>
        </div>
        <h1 className="font-bold text-lg tracking-tight">Court<span className="text-[var(--color-primary-500)]">Side</span></h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)] border border-[var(--color-primary-500)]/20 shadow-[inset_0_0_20px_var(--color-primary-glow)]' 
                  : 'text-gray-400 hover:text-white hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              <Icon size={20} className={`${isActive ? 'text-[var(--color-primary-500)]' : 'group-hover:text-white'} transition-colors`} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Settings */}
      <div className="p-4 border-t border-[var(--color-surface-border)]">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left text-gray-400 hover:text-white hover:bg-[var(--color-surface-hover)] transition-colors">
          <Settings size={20} />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
}
