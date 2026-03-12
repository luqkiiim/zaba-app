'use client';

import { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckSquare,
  Clock,
  MapPin,
  Plus,
  Save,
  Users,
  X,
} from 'lucide-react';
import SetupNotice from '@/components/SetupNotice';
import {
  createSessionRecord,
  listSessions,
  listStudents,
  syncSessionAttendance,
  updateSessionRecord,
} from '@/lib/data';
import { formatDateLabel, toDateInputValue } from '@/lib/date';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { Session, SessionInput, Student } from '@/lib/types';

function normaliseText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempAttendance, setTempAttendance] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [nextSessions, nextStudents] = await Promise.all([listSessions(), listStudents()]);
      setSessions(nextSessions);
      setStudents(nextStudents);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load sessions.');
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

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedSession(null);
  };

  const closeAttendanceModal = () => {
    setIsAttendanceModalOpen(false);
    setSelectedSession(null);
  };

  const handleAddSession = (event: React.FormEvent<HTMLFormElement>) => {
    void (async () => {
      event.preventDefault();

      try {
        setSaving(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const capacity = Number.parseInt(normaliseText(formData.get('capacity')), 10);
        const payload: SessionInput = {
          title: normaliseText(formData.get('title')),
          date: normaliseText(formData.get('date')),
          time: normaliseText(formData.get('time')),
          location: normaliseText(formData.get('location')),
          max_capacity: Number.isNaN(capacity) ? null : capacity,
        };

        await createSessionRecord(payload);
        await loadData();
        setIsModalOpen(false);
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Unable to create the session.');
      } finally {
        setSaving(false);
      }
    })();
  };

  const handleEditSession = (event: React.FormEvent<HTMLFormElement>) => {
    void (async () => {
      event.preventDefault();

      if (!selectedSession) {
        return;
      }

      try {
        setSaving(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const capacity = Number.parseInt(normaliseText(formData.get('capacity')), 10);
        const payload: SessionInput = {
          title: normaliseText(formData.get('title')),
          date: normaliseText(formData.get('date')),
          time: normaliseText(formData.get('time')),
          location: normaliseText(formData.get('location')),
          max_capacity: Number.isNaN(capacity) ? null : capacity,
        };

        await updateSessionRecord(selectedSession.id, payload);
        await loadData();
        closeEditModal();
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Unable to update the session.');
      } finally {
        setSaving(false);
      }
    })();
  };

  const openAttendanceModal = (session: Session) => {
    setSelectedSession(session);
    setTempAttendance([...session.attendance]);
    setIsAttendanceModalOpen(true);
  };

  const toggleAttendance = (studentId: string) => {
    setTempAttendance((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  };

  const saveAttendance = () => {
    void (async () => {
      if (!selectedSession) {
        return;
      }

      try {
        setSaving(true);
        setError(null);

        await syncSessionAttendance(selectedSession.id, tempAttendance);
        await loadData();
        closeAttendanceModal();
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Unable to save attendance.');
      } finally {
        setSaving(false);
      }
    })();
  };

  const today = toDateInputValue();
  const filteredSessions = sessions.filter((session) => {
    if (activeTab === 'Upcoming') {
      return session.date >= today;
    }

    return session.date < today;
  });

  return (
    <div className="relative flex h-full flex-col space-y-6 animate-fade-in">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-surface-border)] bg-[var(--color-background)] pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="mt-2 text-gray-400">Schedule upcoming sessions and track attendance.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--color-secondary-500)] px-4 py-2 font-bold text-white shadow-[0_0_15px_var(--color-secondary-glow)] transition-colors hover:bg-[var(--color-secondary-600)]"
        >
          <Plus size={20} /> New Session
        </button>
      </header>

      {!isSupabaseConfigured && <SetupNotice />}

      {error && (
        <div className="glass-panel border-t-2 border-[var(--color-danger-500)] p-4 text-sm text-gray-300">
          {error}
        </div>
      )}

      {loading && isSupabaseConfigured && (
        <div className="glass-panel p-6 text-sm text-gray-300">Loading sessions...</div>
      )}

      <div className="flex gap-4 border-b border-[var(--color-surface-border)]">
        {['Upcoming', 'Past'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'Upcoming' | 'Past')}
            className={`relative px-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === tab ? 'text-[var(--color-secondary-500)]' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-[var(--color-secondary-500)] shadow-[0_0_10px_var(--color-secondary-glow)]"></span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4 pb-12">
        {filteredSessions.length === 0 ? (
          <div className="glass-panel mt-8 p-12 text-center text-gray-400">
            <CalendarIcon className="mx-auto mb-4 opacity-50" size={48} />
            <h3 className="mb-2 text-xl font-semibold text-white">
              No {activeTab.toLowerCase()} sessions found
            </h3>
            <p>Click &quot;New Session&quot; to schedule one.</p>
          </div>
        ) : (
          filteredSessions.map((session, index) => (
            <div
              key={session.id}
              className={`glass-panel glass-panel-hover animate-fade-in stagger-${(index % 4) + 1} flex flex-col justify-between gap-6 p-6 md:flex-row`}
            >
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="flex items-center gap-3 text-xl font-bold text-white">
                    {session.title}
                    {session.date === today && (
                      <span className="rounded-full border border-[var(--color-primary-500)]/30 bg-[var(--color-primary-500)]/20 px-2 py-1 text-xs text-[var(--color-primary-500)]">
                        Today
                      </span>
                    )}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-[var(--color-secondary-500)]" />
                    {formatDateLabel(session.date, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[var(--color-secondary-500)]" />
                    {session.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-[var(--color-warning-500)]" />
                    {session.location || 'TBD'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[var(--color-primary-500)]" />
                    {session.attendance.length} {session.max_capacity ? `/ ${session.max_capacity}` : ''} attending
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 md:flex-col md:border-l md:border-[var(--color-surface-border)] md:pl-6">
                <button
                  onClick={() => openAttendanceModal(session)}
                  className="group flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-hover)] px-4 py-2 text-sm text-white transition-colors hover:border-[var(--color-primary-500)]/50 hover:bg-white/10 md:w-auto"
                >
                  <CheckSquare
                    size={16}
                    className="text-gray-400 transition-colors group-hover:text-[var(--color-primary-500)]"
                  />
                  Mark Attendance
                </button>
                <button
                  onClick={() => {
                    setSelectedSession(session);
                    setIsEditModalOpen(true);
                  }}
                  className="w-full px-4 py-2 text-center text-sm text-gray-400 transition-colors hover:text-white md:w-auto"
                >
                  Edit Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-card glass-panel relative max-w-md p-6 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="mb-6 text-xl font-bold">Schedule New Session</h2>

            <form onSubmit={handleAddSession} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">Session Title</label>
                <input
                  required
                  name="title"
                  type="text"
                  placeholder="e.g. Saturday Drills"
                  className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white focus:border-[var(--color-secondary-500)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-400">Date</label>
                  <input
                    required
                    name="date"
                    type="date"
                    defaultValue={toDateInputValue()}
                    className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white outline-none focus:border-[var(--color-secondary-500)] [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-400">Time</label>
                  <input
                    required
                    name="time"
                    type="time"
                    className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white focus:border-[var(--color-secondary-500)] focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-400">Location</label>
                  <input
                    name="location"
                    type="text"
                    placeholder="e.g. Court 1"
                    className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white focus:border-[var(--color-secondary-500)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-400">Max Capacity</label>
                  <input
                    name="capacity"
                    type="number"
                    min="1"
                    placeholder="Optional"
                    className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white focus:border-[var(--color-secondary-500)] focus:outline-none"
                  />
                </div>
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
                  disabled={saving}
                  className="rounded-lg bg-[var(--color-secondary-500)] px-4 py-2 font-bold text-white shadow-[0_0_15px_var(--color-secondary-glow)] transition-colors hover:bg-[var(--color-secondary-600)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedSession && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-card glass-panel relative max-w-md p-6 shadow-2xl">
            <button onClick={closeEditModal} className="absolute right-4 top-4 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="mb-6 text-xl font-bold">Edit Session Details</h2>

            <form onSubmit={handleEditSession} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">Session Title</label>
                <input
                  required
                  name="title"
                  defaultValue={selectedSession.title}
                  type="text"
                  className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white focus:border-[var(--color-secondary-500)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-400">Date</label>
                  <input
                    required
                    name="date"
                    defaultValue={selectedSession.date}
                    type="date"
                    className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white outline-none focus:border-[var(--color-secondary-500)] [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-400">Time</label>
                  <input
                    required
                    name="time"
                    defaultValue={selectedSession.time}
                    type="time"
                    className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white focus:border-[var(--color-secondary-500)] focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-400">Location</label>
                  <input
                    name="location"
                    defaultValue={selectedSession.location}
                    type="text"
                    className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white focus:border-[var(--color-secondary-500)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-400">Max Capacity</label>
                  <input
                    name="capacity"
                    defaultValue={selectedSession.max_capacity ?? ''}
                    type="number"
                    min="1"
                    className="w-full rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface)] px-3 py-2 text-white focus:border-[var(--color-secondary-500)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg px-4 py-2 text-gray-400 transition-colors hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[var(--color-secondary-500)] px-4 py-2 font-bold text-white shadow-[0_0_15px_var(--color-secondary-glow)] transition-colors hover:bg-[var(--color-secondary-600)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAttendanceModalOpen && selectedSession && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-card glass-panel relative max-w-md border-t-2 border-[var(--color-primary-500)] p-6 shadow-2xl">
            <button
              onClick={closeAttendanceModal}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="mb-2 flex items-center gap-2 text-xl font-bold">
              <CheckSquare className="text-[var(--color-primary-500)]" /> Mark Attendance
            </h2>
            <p className="mb-6 text-sm text-gray-400">
              {selectedSession.title} ({selectedSession.date})
            </p>

            <div className="mb-6 max-h-60 space-y-2 overflow-y-auto pr-2">
              {students.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">
                  No students available. Add some in the Students tab first.
                </p>
              ) : (
                students.map((student) => {
                  const isChecked = tempAttendance.includes(student.id);
                  const isOutOfQuota = student.session_quota === 0;

                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleAttendance(student.id)}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                        isChecked
                          ? 'border-[var(--color-primary-500)]/30 bg-[var(--color-primary-500)]/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-medium ${isChecked ? 'text-white' : 'text-gray-300'}`}>
                            {student.name}
                          </div>
                          <div
                            className={`mt-1 text-xs ${
                              isOutOfQuota && !isChecked
                                ? 'text-[var(--color-danger-500)]'
                                : 'text-gray-500'
                            }`}
                          >
                            {student.session_quota} quota remaining
                          </div>
                        </div>

                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${
                            isChecked
                              ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)] text-gray-900'
                              : 'border-gray-500'
                          }`}
                        >
                          {isChecked && <CheckSquare size={14} />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mb-6 rounded-lg border border-[var(--color-warning-500)]/20 bg-[var(--color-warning-500)]/10 p-3">
              <p className="text-xs text-[var(--color-warning-500)]">
                <strong>Note:</strong> Saving attendance will automatically deduct 1 quota from
                any newly checked student, and refund 1 quota to any unchecked student.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-[var(--color-surface-border)] pt-4">
              <button
                onClick={closeAttendanceModal}
                className="rounded-lg px-4 py-2 text-gray-400 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="rounded-lg bg-[var(--color-primary-500)] px-4 py-2 font-bold text-gray-900 shadow-[0_0_15px_var(--color-primary-glow)] transition-colors hover:bg-[var(--color-primary-600)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : `Save Attendance (${tempAttendance.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
