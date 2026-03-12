'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, CalendarDays, ChevronRight, TrendingUp, Users } from 'lucide-react';
import SetupNotice from '@/components/SetupNotice';
import { listDashboardData } from '@/lib/data';
import { formatDateLabel, isInSameMonth, toDateInputValue, toSessionTimestamp } from '@/lib/date';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { Payment, Session, Student } from '@/lib/types';

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await listDashboardData();

        if (cancelled) {
          return;
        }

        setStudents(data.students);
        setSessions(data.sessions);
        setPayments(data.payments);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load the dashboard.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalStudents = students.length;
  const today = toDateInputValue();
  const upcomingSessions = sessions
    .filter((session) => session.date >= today)
    .sort((a, b) => toSessionTimestamp(a.date, a.time) - toSessionTimestamp(b.date, b.time));
  const nextSession = upcomingSessions[0];
  const lowQuotaStudents = students.filter((student) => student.session_quota <= 1);
  const zeroQuotaStudents = students.filter((student) => student.session_quota === 0);
  const thisMonthRevenue = payments
    .filter((payment) => isInSameMonth(payment.date))
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-gray-400">Welcome back, Coach. Here&apos;s your court-side overview.</p>
      </header>

      {!isSupabaseConfigured && <SetupNotice />}

      {error && (
        <div className="glass-panel border-t-2 border-[var(--color-danger-500)] p-6">
          <h2 className="text-lg font-semibold text-white">Unable to load dashboard</h2>
          <p className="mt-2 text-sm text-gray-300">{error}</p>
        </div>
      )}

      {loading && isSupabaseConfigured && (
        <div className="glass-panel p-6 text-sm text-gray-300">Loading your latest dashboard data...</div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={totalStudents.toString()}
          icon={<Users className="text-[var(--color-secondary-500)]" size={24} />}
          trend="Active roster"
          delay="stagger-1"
        />
        <StatCard
          title="Upcoming Sessions"
          value={upcomingSessions.length.toString()}
          icon={<CalendarDays className="text-[var(--color-primary-500)]" size={24} />}
          trend={
            nextSession
              ? `Next: ${formatDateLabel(nextSession.date, { month: 'short', day: 'numeric' })} at ${nextSession.time}`
              : 'No upcoming classes'
          }
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="glass-panel border-t-2 border-[var(--color-primary-500)] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-primary-500)] shadow-[0_0_10px_var(--color-primary-glow)]"></span>
                Next Up on Court
              </h2>
              <Link href="/sessions" className="flex items-center text-sm text-[var(--color-primary-500)] transition-colors hover:text-white">
                View All <ChevronRight size={16} />
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingSessions.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <CalendarDays size={32} className="mx-auto mb-3 opacity-50" />
                  <p>No upcoming sessions scheduled.</p>
                </div>
              ) : (
                upcomingSessions.slice(0, 3).map((session, index) => (
                  <div
                    key={session.id}
                    className={`glass-panel-hover group flex cursor-pointer flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center ${index > 0 ? 'opacity-80' : ''}`}
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-[var(--color-primary-500)]">
                        {session.title}
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-sm text-gray-400">
                        <span>{formatDateLabel(session.date, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span aria-hidden="true">&bull;</span>
                        <span>{session.time}</span>
                        <span aria-hidden="true">&bull;</span>
                        <span className="text-[var(--color-secondary-500)]">{session.location || 'TBD'}</span>
                      </p>
                    </div>
                    <div className="mt-4 rounded-lg bg-black/20 p-2 text-left sm:mt-0 sm:bg-transparent sm:p-0 sm:text-right">
                      <div className="text-sm font-medium">
                        <span className="text-[var(--color-primary-500)]">{session.attendance.length}</span>
                        {session.max_capacity ? ` / ${session.max_capacity}` : ''}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-wider text-gray-500">Attendees</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel border-t-2 border-[var(--color-warning-500)] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <AlertTriangle size={18} className="text-[var(--color-warning-500)]" />
              Needs Attention
            </h2>
            <div className="space-y-4">
              {lowQuotaStudents.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">
                  All students have sufficient quotas. You&apos;re all caught up!
                </p>
              ) : (
                lowQuotaStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between border-b border-[var(--color-surface-border)] pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="text-sm font-medium text-white">{student.name}</div>
                      <div
                        className={`mt-1 text-xs ${
                          student.session_quota === 0
                            ? 'font-bold text-[var(--color-danger-500)]'
                            : 'text-[var(--color-warning-500)]'
                        }`}
                      >
                        {student.session_quota} sessions remaining
                      </div>
                    </div>
                    <Link
                      href="/payments"
                      className="rounded-md border border-[var(--color-primary-500)]/30 bg-[var(--color-primary-500)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-500)] transition-all hover:bg-[var(--color-primary-500)] hover:text-gray-900"
                    >
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

function StatCard({
  title,
  value,
  icon,
  trend,
  delay,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  trend: string;
  delay: string;
}) {
  return (
    <div className={`glass-panel glass-panel-hover animate-fade-in p-6 ${delay}`}>
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-hover)] p-2">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="mb-1 text-4xl font-bold tracking-tight text-white">{value}</h3>
        <p className="text-sm font-medium text-gray-400">{title}</p>
      </div>
      <div className="mt-4 border-t border-[var(--color-surface-border)] pt-4">
        <span className="text-xs text-gray-500">{trend}</span>
      </div>
    </div>
  );
}
