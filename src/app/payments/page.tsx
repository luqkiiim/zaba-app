'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Plus, TrendingUp, Wallet, X } from 'lucide-react';
import SetupNotice from '@/components/SetupNotice';
import { createPayment, listPayments, listStudents } from '@/lib/data';
import { formatDateLabel, isInSameMonth, toDateInputValue } from '@/lib/date';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { Payment, PaymentInput, Student } from '@/lib/types';

function normaliseText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [nextPayments, nextStudents] = await Promise.all([listPayments(), listStudents()]);
      setPayments(nextPayments);
      setStudents(nextStudents);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    void loadData();
  }, []);

  const handleAddPayment = (event: React.FormEvent<HTMLFormElement>) => {
    void (async () => {
      event.preventDefault();

      try {
        setSaving(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const amount = Number.parseFloat(normaliseText(formData.get('amount')));
        const addedQuota = Number.parseInt(normaliseText(formData.get('added_quota')), 10);
        const payload: PaymentInput = {
          student_id: normaliseText(formData.get('student_id')),
          amount: Number.isNaN(amount) ? 0 : amount,
          date: normaliseText(formData.get('date')),
          type: normaliseText(formData.get('type')) as Payment['type'],
          notes: normaliseText(formData.get('notes')),
          added_quota: Number.isNaN(addedQuota) ? 0 : Math.max(addedQuota, 0),
        };

        await createPayment(payload);
        await loadData();
        setIsModalOpen(false);
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Unable to save the payment.');
      } finally {
        setSaving(false);
      }
    })();
  };

  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const thisMonthRevenue = payments
    .filter((payment) => isInSameMonth(payment.date))
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="relative flex h-full flex-col space-y-6 animate-fade-in">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-surface-border)] bg-[var(--color-background)] pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="mt-2 text-gray-400">Log top-ups, track monthly fees, and view revenue.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!students.length || !isSupabaseConfigured}
          className="flex items-center gap-2 rounded-lg bg-[var(--color-primary-500)] px-4 py-2 font-bold text-gray-900 shadow-[0_0_15px_var(--color-primary-glow)] transition-colors hover:bg-[var(--color-primary-600)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={20} /> Log Payment
        </button>
      </header>

      {!isSupabaseConfigured && <SetupNotice />}

      {error && (
        <div className="glass-panel border-t-2 border-[var(--color-danger-500)] p-4 text-sm text-gray-300">
          {error}
        </div>
      )}

      {loading && isSupabaseConfigured && (
        <div className="glass-panel p-6 text-sm text-gray-300">Loading payments...</div>
      )}

      {!loading && students.length === 0 && isSupabaseConfigured && (
        <div className="glass-panel p-6 text-sm text-gray-300">
          Add a student first, then you can log payments and quota top-ups.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="glass-panel border-t-4 border-t-[var(--color-primary-500)] p-6">
          <div className="mb-2 flex items-start justify-between">
            <h3 className="text-sm font-medium text-gray-400">Total Revenue (All Time)</h3>
            <Wallet className="text-[var(--color-primary-500)]" size={20} />
          </div>
          <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>

        <div className="glass-panel border-t-4 border-t-[var(--color-secondary-500)] p-6">
          <div className="mb-2 flex items-start justify-between">
            <h3 className="text-sm font-medium text-gray-400">This Month</h3>
            <TrendingUp className="text-[var(--color-secondary-500)]" size={20} />
          </div>
          <p className="text-3xl font-bold">${thisMonthRevenue.toFixed(2)}</p>
        </div>

        <div className="glass-panel border-t-4 border-t-[var(--color-warning-500)] bg-[var(--color-warning-500)]/5 p-6">
          <div className="mb-2 flex items-start justify-between">
            <h3 className="text-sm font-medium text-[var(--color-warning-500)]">Zero Quota Students</h3>
            <AlertCircle className="text-[var(--color-warning-500)]" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">
            {students.filter((student) => student.session_quota === 0).length}
            <span className="ml-2 text-sm font-normal text-gray-400">need top-ups</span>
          </p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--color-surface-border)] bg-[var(--color-surface-hover)]">
                <th className="p-4 font-medium text-gray-400">Date</th>
                <th className="p-4 font-medium text-gray-400">Student</th>
                <th className="p-4 font-medium text-gray-400">Amount</th>
                <th className="p-4 font-medium text-gray-400">Type</th>
                <th className="p-4 font-medium text-gray-400">Notes</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No payments logged yet.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const student = students.find((candidate) => candidate.id === payment.student_id);

                  return (
                    <tr
                      key={payment.id}
                      className="border-b border-[var(--color-surface-border)] transition-colors hover:bg-[var(--color-surface-hover)]"
                    >
                      <td className="p-4 text-gray-300">
                        {formatDateLabel(payment.date, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="p-4 font-medium text-white">{student?.name || 'Unknown Student'}</td>
                      <td className="p-4 font-bold text-[var(--color-primary-500)]">
                        +${payment.amount.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full border px-2 py-1 text-xs ${
                            payment.type === 'Quota Top-up'
                              ? 'border-[var(--color-primary-500)]/20 bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)]'
                              : 'border-[var(--color-secondary-500)]/20 bg-[var(--color-secondary-500)]/10 text-[var(--color-secondary-500)]'
                          }`}
                        >
                          {payment.type}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-400">{payment.notes || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-card glass-panel relative max-w-md border-t-2 border-[var(--color-primary-500)] p-6 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
              <Wallet className="text-[var(--color-primary-500)]" /> Log Receipt
            </h2>

            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">Student</label>
                <select
                  required
                  name="student_id"
                  defaultValue=""
                  className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white outline-none focus:border-[var(--color-primary-500)]"
                >
                  <option value="" disabled>
                    Select a student...
                  </option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.session_quota} left)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-400">Amount ($)</label>
                  <input
                    required
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-lg font-bold text-[var(--color-primary-500)] text-white focus:border-[var(--color-primary-500)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-400">Date</label>
                  <input
                    required
                    name="date"
                    type="date"
                    defaultValue={toDateInputValue()}
                    className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white outline-none focus:border-[var(--color-primary-500)] [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-4 border-t border-[var(--color-surface-border)] pt-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-400">Payment Type</label>
                  <select
                    name="type"
                    className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white outline-none focus:border-[var(--color-primary-500)]"
                  >
                    <option value="Quota Top-up">Quota Top-up</option>
                    <option value="Monthly Fee">Monthly Fee</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-medium text-[var(--color-primary-500)]">
                    Add Quota <CheckCircle2 size={12} />
                  </label>
                  <input
                    name="added_quota"
                    type="number"
                    min="0"
                    placeholder="e.g. 10 sessions"
                    className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white focus:border-[var(--color-primary-500)] focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-gray-400">Auto-adds to student balance</p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">Notes (Optional)</label>
                <input
                  name="notes"
                  type="text"
                  placeholder="e.g. Bank transfer, cash..."
                  className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white focus:border-[var(--color-primary-500)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-gray-400 transition-colors hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || students.length === 0}
                  className="flex items-center gap-2 rounded-lg bg-[var(--color-primary-500)] px-4 py-2 font-bold text-gray-900 shadow-[0_0_15px_var(--color-primary-glow)] transition-colors hover:bg-[var(--color-primary-600)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 size={18} /> {saving ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
