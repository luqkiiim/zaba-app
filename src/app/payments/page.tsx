'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { Plus, X, Wallet, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

type Payment = {
  id: string;
  student_id: string;
  amount: number;
  date: string;
  type: 'Quota Top-up' | 'Monthly Fee' | 'Other';
  notes: string;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useLocalStorage<Payment[]>('court-side-payments', [
    { id: '1', student_id: '1', amount: 150, date: '2026-03-01', type: 'Quota Top-up', notes: '10 sessions' },
    { id: '2', student_id: '3', amount: 200, date: '2026-03-10', type: 'Monthly Fee', notes: 'March training' },
  ]);

  const [students, setStudents] = useLocalStorage<any[]>('court-side-students', [
    { id: '1', name: 'Alex Johnson', level: 'Intermediate', session_quota: 2 },
    { id: '2', name: 'Sarah Smith', level: 'Beginner', session_quota: 0 },
    { id: '3', name: 'Mike Chen', level: 'Advanced', session_quota: 10 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amountStr = formData.get('amount') as string;
    const studentId = formData.get('student_id') as string;
    const type = formData.get('type') as Payment['type'];
    const addedQuotaStr = formData.get('added_quota') as string;
    
    const newPayment: Payment = {
      id: Date.now().toString(),
      student_id: studentId,
      amount: parseFloat(amountStr),
      date: formData.get('date') as string,
      type: type,
      notes: formData.get('notes') as string,
    };

    // Add payment
    setPayments([newPayment, ...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    // Automatically update student quota if it's a top-up
    if (type === 'Quota Top-up' && addedQuotaStr) {
      const addedQuota = parseInt(addedQuotaStr);
      setStudents(students.map(s => 
        s.id === studentId 
          ? { ...s, session_quota: s.session_quota + addedQuota } 
          : s
      ));
    }

    setIsModalOpen(false);
  };

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const thisMonthRevenue = payments
    .filter(p => new Date(p.date).getMonth() === new Date().getMonth())
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="animate-fade-in space-y-6 flex flex-col h-full relative">
      <header className="flex justify-between items-center bg-[var(--color-background)] z-10 sticky top-0 pb-4 border-b border-[var(--color-surface-border)]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-gray-400 mt-2">Log top-ups, track monthly fees, and view revenue.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--color-primary-500)] text-gray-900 font-bold px-4 py-2 rounded-lg hover:bg-[var(--color-primary-600)] transition-colors shadow-[0_0_15px_var(--color-primary-glow)] flex items-center gap-2"
        >
          <Plus size={20} /> Log Payment
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 border-t-4 border-t-[var(--color-primary-500)]">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-400 font-medium text-sm">Total Revenue (All Time)</h3>
            <Wallet className="text-[var(--color-primary-500)]" size={20} />
          </div>
          <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>
        
        <div className="glass-panel p-6 border-t-4 border-t-[var(--color-secondary-500)]">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-400 font-medium text-sm">This Month</h3>
            <TrendingUp className="text-[var(--color-secondary-500)]" size={20} />
          </div>
          <p className="text-3xl font-bold">${thisMonthRevenue.toFixed(2)}</p>
        </div>

        <div className="glass-panel p-6 border-t-4 border-t-[var(--color-warning-500)] bg-[var(--color-warning-500)]/5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[var(--color-warning-500)] font-medium text-sm">Zero Quota Students</h3>
            <AlertCircle className="text-[var(--color-warning-500)]" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">
            {students.filter(s => s.session_quota === 0).length} 
            <span className="text-sm font-normal text-gray-400 ml-2">need top-ups</span>
          </p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
                payments.map((payment, i) => {
                  const student = students.find(s => s.id === payment.student_id);
                  return (
                    <tr key={payment.id} className="border-b border-[var(--color-surface-border)] hover:bg-[var(--color-surface-hover)] transition-colors">
                      <td className="p-4 text-gray-300">
                        {new Date(payment.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 font-medium text-white">{student?.name || 'Unknown Student'}</td>
                      <td className="p-4 font-bold text-[var(--color-primary-500)]">
                        +${payment.amount.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full border ${
                          payment.type === 'Quota Top-up' 
                            ? 'bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)] border-[var(--color-primary-500)]/20' 
                            : 'bg-[var(--color-secondary-500)]/10 text-[var(--color-secondary-500)] border-[var(--color-secondary-500)]/20'
                        }`}>
                          {payment.type}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-400">{payment.notes || '-'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
          <div className="glass-panel max-w-md w-full p-6 shadow-2xl relative border-t-2 border-[var(--color-primary-500)]">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Wallet className="text-[var(--color-primary-500)]" /> Log Receipt
            </h2>
            
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Student</label>
                <select required name="student_id" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white outline-none focus:border-[var(--color-primary-500)]">
                  <option value="" disabled selected>Select a student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.session_quota} left)</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Amount ($)</label>
                  <input required name="amount" type="number" step="0.01" min="0" placeholder="0.00" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-primary-500)] text-lg font-bold text-[var(--color-primary-500)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                  <input required name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white outline-none focus:border-[var(--color-primary-500)] [color-scheme:dark]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-surface-border)] pt-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Payment Type</label>
                  <select name="type" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white outline-none focus:border-[var(--color-primary-500)]">
                    <option value="Quota Top-up">Quota Top-up</option>
                    <option value="Monthly Fee">Monthly Fee</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-primary-500)] mb-1 flex items-center gap-1">
                     Add Quota <CheckCircle2 size={12}/>
                  </label>
                  <input name="added_quota" type="number" min="0" placeholder="e.g. 10 sessions" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-primary-500)]" />
                  <p className="text-[10px] text-gray-400 mt-1">Auto-adds to student balance</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Notes (Optional)</label>
                <input name="notes" type="text" placeholder="e.g. Bank transfer, cash..." className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-primary-500)]" />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[var(--color-primary-500)] text-gray-900 font-bold px-4 py-2 rounded-lg hover:bg-[var(--color-primary-600)] transition-colors shadow-[0_0_15px_var(--color-primary-glow)] flex items-center gap-2"
                >
                  <CheckCircle2 size={18} /> Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
