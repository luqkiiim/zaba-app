'use client';

import { useEffect, useState } from 'react';
import { Edit2, Plus, Search, X } from 'lucide-react';
import SetupNotice from '@/components/SetupNotice';
import { createStudent, listStudents, updateStudent } from '@/lib/data';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { Student, StudentInput } from '@/lib/types';

function normaliseText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudentsFromSupabase = async () => {
    try {
      setLoading(true);
      setError(null);

      const nextStudents = await listStudents();
      setStudents(nextStudents);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    void loadStudentsFromSupabase();
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void (async () => {
      event.preventDefault();

      try {
        setSaving(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const quota = Number.parseInt(normaliseText(formData.get('quota')), 10);
        const payload: StudentInput = {
          name: normaliseText(formData.get('name')),
          level: normaliseText(formData.get('level')) as Student['level'],
          session_quota: Number.isNaN(quota) ? 0 : Math.max(quota, 0),
          contact_info: normaliseText(formData.get('contact')),
          notes: normaliseText(formData.get('notes')),
        };

        if (editingStudent) {
          const updated = await updateStudent(editingStudent.id, payload);
          setStudents((current) =>
            current
              .map((student) => (student.id === updated.id ? updated : student))
              .sort((a, b) => a.name.localeCompare(b.name)),
          );
        } else {
          const created = await createStudent(payload);
          setStudents((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
        }

        closeModal();
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Unable to save the student.');
      } finally {
        setSaving(false);
      }
    })();
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="relative flex h-full flex-col space-y-6 animate-fade-in">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-surface-border)] bg-[var(--color-background)] pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="mt-2 text-gray-400">Manage your players, their levels, and quotas.</p>
        </div>
        <button
          onClick={() => {
            setEditingStudent(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-[var(--color-primary-500)] px-4 py-2 font-bold text-gray-900 shadow-[0_0_15px_var(--color-primary-glow)] transition-colors hover:bg-[var(--color-primary-600)]"
        >
          <Plus size={20} /> Add Student
        </button>
      </header>

      {!isSupabaseConfigured && <SetupNotice />}

      {error && (
        <div className="glass-panel border-t-2 border-[var(--color-danger-500)] p-4 text-sm text-gray-300">
          {error}
        </div>
      )}

      {loading && isSupabaseConfigured && (
        <div className="glass-panel p-6 text-sm text-gray-300">Loading students...</div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] py-3 pl-10 pr-4 text-white transition-colors focus:border-[var(--color-primary-500)] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 pb-12 md:grid-cols-2 lg:grid-cols-3">
        {!loading && filteredStudents.length === 0 && (
          <div className="glass-panel p-8 text-center text-gray-400 md:col-span-2 lg:col-span-3">
            {students.length === 0
              ? 'No students yet. Add your first student to get started.'
              : 'No students match your search.'}
          </div>
        )}

        {filteredStudents.map((student, index) => (
          <div
            key={student.id}
            className={`glass-panel glass-panel-hover animate-fade-in p-6 stagger-${(index % 4) + 1}`}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">{student.name}</h3>
                <span className="mt-2 inline-block rounded-full bg-white/10 px-2 py-1 text-xs">
                  {student.level}
                </span>
              </div>
              <button
                onClick={() => {
                  setEditingStudent(student);
                  setIsModalOpen(true);
                }}
                className="text-gray-400 transition-colors hover:text-[var(--color-primary-500)]"
                aria-label={`Edit ${student.name}`}
              >
                <Edit2 size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Session Quota</span>
                <span
                  className={`font-bold ${
                    student.session_quota === 0
                      ? 'text-[var(--color-warning-500)]'
                      : 'text-[var(--color-primary-500)]'
                  }`}
                >
                  {student.session_quota} sessions left
                </span>
              </div>

              {student.contact_info && (
                <div className="border-t border-[var(--color-surface-border)] pt-3 text-sm">
                  <span className="mb-1 block text-gray-400">Contact</span>
                  <p className="truncate">{student.contact_info}</p>
                </div>
              )}

              {student.notes && (
                <div className="border-t border-[var(--color-surface-border)] pt-3 text-sm">
                  <span className="mb-1 block text-gray-400">Coach Notes</span>
                  <p className="line-clamp-2 text-gray-300">{student.notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-card glass-panel relative max-w-md p-4 shadow-2xl sm:p-6">
            <button onClick={closeModal} className="absolute right-4 top-4 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="mb-4 pr-10 text-xl font-bold sm:mb-6">
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">Full Name</label>
                <input
                  required
                  name="name"
                  type="text"
                  defaultValue={editingStudent?.name ?? ''}
                  className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white focus:border-[var(--color-primary-500)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-400">Level</label>
                  <select
                    name="level"
                    defaultValue={editingStudent?.level ?? 'Beginner'}
                    className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white outline-none focus:border-[var(--color-primary-500)]"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Pro">Pro</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-400">Initial Quota</label>
                  <input
                    name="quota"
                    type="number"
                    min="0"
                    defaultValue={editingStudent?.session_quota ?? 0}
                    className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white focus:border-[var(--color-primary-500)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">Contact Info (Optional)</label>
                <input
                  name="contact"
                  type="text"
                  defaultValue={editingStudent?.contact_info ?? ''}
                  className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white focus:border-[var(--color-primary-500)] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">Private Coach Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={editingStudent?.notes ?? ''}
                  className="w-full resize-none rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white focus:border-[var(--color-primary-500)] focus:outline-none"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3 sm:pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full rounded-lg px-4 py-2 text-gray-400 transition-colors hover:text-white sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-[var(--color-primary-500)] px-4 py-2 font-bold text-gray-900 shadow-[0_0_15px_var(--color-primary-glow)] transition-colors hover:bg-[var(--color-primary-600)] sm:w-auto"
                >
                  {saving ? 'Saving...' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
