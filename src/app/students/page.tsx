'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { Plus, X, Search, Edit2 } from 'lucide-react';

type Student = {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
  session_quota: number;
  contact_info: string;
  notes: string;
};

export default function StudentsPage() {
  const [students, setStudents] = useLocalStorage<Student[]>('court-side-students', [
    { id: '1', name: 'Alex Johnson', level: 'Intermediate', session_quota: 2, contact_info: 'alex@example.com', notes: 'Great backhand, needs work on footwork' },
    { id: '2', name: 'Sarah Smith', level: 'Beginner', session_quota: 0, contact_info: '555-0192', notes: 'First session next week' },
    { id: '3', name: 'Mike Chen', level: 'Advanced', session_quota: 10, contact_info: 'mike@example.com', notes: 'Tournament prep' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newStudent: Student = {
      id: Date.now().toString(),
      name: formData.get('name') as string,
      level: formData.get('level') as Student['level'],
      session_quota: parseInt(formData.get('quota') as string) || 0,
      contact_info: formData.get('contact') as string,
      notes: formData.get('notes') as string,
    };

    setStudents([...students, newStudent]);
    setIsModalOpen(false);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6 flex flex-col h-full relative">
      <header className="flex justify-between items-center bg-[var(--color-background)] z-10 sticky top-0 pb-4 border-b border-[var(--color-surface-border)]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-gray-400 mt-2">Manage your players, their levels, and quotas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--color-primary-500)] text-gray-900 font-bold px-4 py-2 rounded-lg hover:bg-[var(--color-primary-600)] transition-colors shadow-[0_0_15px_var(--color-primary-glow)] flex items-center gap-2"
        >
          <Plus size={20} /> Add Student
        </button>
      </header>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search students..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-[var(--color-primary-500)] transition-colors text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
        {filteredStudents.map((student, i) => (
          <div key={student.id} className={`glass-panel p-6 glass-panel-hover animate-fade-in stagger-${(i % 4) + 1}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">{student.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full bg-white/10 mt-2 inline-block`}>
                  {student.level}
                </span>
              </div>
              <button className="text-gray-400 hover:text-[var(--color-primary-500)] transition-colors">
                <Edit2 size={16} />
              </button>
            </div>
            
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Session Quota</span>
                <span className={`font-bold ${student.session_quota === 0 ? 'text-[var(--color-warning-500)]' : 'text-[var(--color-primary-500)]'}`}>
                  {student.session_quota} sessions left
                </span>
              </div>
              
              {student.contact_info && (
                <div className="text-sm border-t border-[var(--color-surface-border)] pt-3">
                  <span className="text-gray-400 block mb-1">Contact</span>
                  <p className="truncate">{student.contact_info}</p>
                </div>
              )}

              {student.notes && (
                <div className="text-sm border-t border-[var(--color-surface-border)] pt-3">
                  <span className="text-gray-400 block mb-1">Coach Notes</span>
                  <p className="text-gray-300 line-clamp-2">{student.notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
          <div className="glass-panel max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-6">Add New Student</h2>
            
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                <input required name="name" type="text" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-primary-500)]" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Level</label>
                  <select name="level" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white outline-none focus:border-[var(--color-primary-500)]">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Pro">Pro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Initial Quota</label>
                  <input name="quota" type="number" min="0" defaultValue="0" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-primary-500)]" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Contact Info (Optional)</label>
                <input name="contact" type="text" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-primary-500)]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Private Coach Notes (Optional)</label>
                <textarea name="notes" rows={3} className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-primary-500)] resize-none" />
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
                  className="bg-[var(--color-primary-500)] text-gray-900 font-bold px-4 py-2 rounded-lg hover:bg-[var(--color-primary-600)] transition-colors shadow-[0_0_15px_var(--color-primary-glow)]"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
