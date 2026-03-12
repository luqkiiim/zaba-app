'use client';

import { useLocalStorage } from '@/lib/useLocalStorage';
import { Users, CalendarDays, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  // Read from our local storage states
  const [students] = useLocalStorage<any[]>('court-side-students', []);
  const [sessions] = useLocalStorage<any[]>('court-side-sessions', []);
  const [payments] = useLocalStorage<any[]>('court-side-payments', []);

  // Calculate metrics
  const totalStudents = students.length;
  
  const today = new Date().toISOString().split('T')[0];
  const upcomingSessions = sessions.filter(s => s.date >= today).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextSession = upcomingSessions[0];

  const lowQuotaStudents = students.filter(s => s.session_quota <= 1);
  const zeroQuotaStudents = students.filter(s => s.session_quota === 0);
  
  const thisMonthRevenue = payments
    .filter(p => new Date(p.date).getMonth() === new Date().getMonth())
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-400 mt-2">Welcome back, Coach. Here's your court-side overview.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={totalStudents.toString()} 
          icon={<Users className="text-[var(--color-secondary-500)]" size={24} />} 
          trend="Active Roster"
          delay="stagger-1"
        />
        <StatCard 
          title="Upcoming Sessions" 
          value={upcomingSessions.length.toString()} 
          icon={<CalendarDays className="text-[var(--color-primary-500)]" size={24} />} 
          trend={nextSession ? `Next: ${new Date(nextSession.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} at ${nextSession.time}` : 'No upcoming classes'}
          delay="stagger-2"
        />
        <StatCard 
          title="Low Quota Alerts" 
          value={lowQuotaStudents.length.toString()} 
          icon={<AlertTriangle className="text-[var(--color-warning-500)]" size={24} />} 
          trend={`${zeroQuotaStudents.length} students at 0`}
          delay="stagger-3"
        />
        <StatCard 
          title="Monthly Revenue" 
          value={`$${thisMonthRevenue.toFixed(0)}`} 
          icon={<TrendingUp className="text-[var(--color-primary-500)]" size={24} />} 
          trend="This month"
          delay="stagger-4"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed: Upcoming Sessions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 border-t-2 border-[var(--color-primary-500)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary-500)] animate-pulse shadow-[0_0_10px_var(--color-primary-glow)]"></span>
                Next Up on Court
              </h2>
              <Link href="/sessions" className="text-sm text-[var(--color-primary-500)] hover:text-white transition-colors flex items-center">
                View All <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="space-y-4">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CalendarDays size={32} className="mx-auto mb-3 opacity-50" />
                  <p>No upcoming sessions scheduled.</p>
                </div>
              ) : (
                upcomingSessions.slice(0, 3).map((session, i) => (
                  <div key={session.id} className={`p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row justify-between sm:items-center glass-panel-hover group cursor-pointer ${i > 0 ? 'opacity-80' : ''}`}>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-[var(--color-primary-500)] transition-colors text-lg">{session.title}</h3>
                      <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                        <span>{new Date(session.date).toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'})}</span>
                        <span>•</span>
                        <span>{session.time}</span>
                        <span>•</span>
                        <span className="text-[var(--color-secondary-500)]">{session.location}</span>
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0 text-left sm:text-right bg-black/20 p-2 sm:p-0 sm:bg-transparent rounded-lg">
                      <div className="text-sm font-medium">
                        <span className="text-[var(--color-primary-500)]">{session.attendance?.length || 0}</span> 
                        {session.max_capacity ? ` / ${session.max_capacity}` : ''}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Attendees</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Action Items Sidebar */}
        <div className="space-y-6">
          <div className="glass-panel p-6 border-t-2 border-[var(--color-warning-500)]">
            <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-[var(--color-warning-500)]" />
              Needs Attention
            </h2>
            <div className="space-y-4">
              {lowQuotaStudents.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">All students have sufficient quotas. You're all caught up!</p>
              ) : (
                lowQuotaStudents.map(student => (
                  <div key={student.id} className="flex items-center justify-between pb-4 border-b border-[var(--color-surface-border)] last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium text-sm text-white">{student.name}</div>
                      <div className={`text-xs mt-1 ${student.session_quota === 0 ? 'text-[var(--color-danger-500)] font-bold' : 'text-[var(--color-warning-500)]'}`}>
                        {student.session_quota} sessions remaining
                      </div>
                    </div>
                    <Link href="/payments" className="text-xs bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)] border border-[var(--color-primary-500)]/30 hover:bg-[var(--color-primary-500)] hover:text-gray-900 px-3 py-1.5 rounded-md transition-all font-semibold">
                      Top up
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, delay }: {title: string, value: string, icon: React.ReactNode, trend: string, delay: string}) {
  return (
    <div className={`glass-panel p-6 glass-panel-hover animate-fade-in ${delay}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-surface-border)]">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-4xl font-bold tracking-tight mb-1 text-white">{value}</h3>
        <p className="text-sm text-gray-400 font-medium">{title}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-[var(--color-surface-border)]">
        <span className="text-xs text-gray-500">{trend}</span>
      </div>
    </div>
  );
}
