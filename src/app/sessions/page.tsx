'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { Plus, X, Calendar as CalendarIcon, Clock, MapPin, Users, CheckSquare, Save } from 'lucide-react';

type Session = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  max_capacity: number | null;
  attendance: string[]; // array of student IDs
};

export default function SessionsPage() {
  const [sessions, setSessions] = useLocalStorage<Session[]>('court-side-sessions', [
    { id: '1', title: 'Tuesday Match Play', date: new Date().toISOString().split('T')[0], time: '17:00', location: 'Main Court', max_capacity: 16, attendance: ['1', '3'] },
    { id: '2', title: 'Saturday Drills - Beginners', date: '2026-03-15', time: '09:00', location: 'Court 3', max_capacity: 8, attendance: [] },
  ]);
  
  // Need students data to resolve names for attendance
  const [students, setStudents] = useLocalStorage<any[]>('court-side-students', [
    { id: '1', name: 'Alex Johnson', level: 'Intermediate', session_quota: 2 },
    { id: '2', name: 'Sarah Smith', level: 'Beginner', session_quota: 0 },
    { id: '3', name: 'Mike Chen', level: 'Advanced', session_quota: 10 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Local state for the attendance modal checkboxes
  const [tempAttendance, setTempAttendance] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past'>('Upcoming');

  const handleAddSession = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const capacityStr = formData.get('capacity') as string;
    
    const newSession: Session = {
      id: Date.now().toString(),
      title: formData.get('title') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      location: formData.get('location') as string,
      max_capacity: capacityStr ? parseInt(capacityStr) : null,
      attendance: [],
    };

    setSessions([...sessions, newSession].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setIsModalOpen(false);
  };

  const handleEditSession = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSession) return;
    
    const formData = new FormData(e.currentTarget);
    const capacityStr = formData.get('capacity') as string;
    
    const updatedSession: Session = {
      ...selectedSession,
      title: formData.get('title') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      location: formData.get('location') as string,
      max_capacity: capacityStr ? parseInt(capacityStr) : null,
    };

    setSessions(sessions.map(s => s.id === updatedSession.id ? updatedSession : s)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setIsEditModalOpen(false);
    setSelectedSession(null);
  };

  const openAttendanceModal = (session: Session) => {
    setSelectedSession(session);
    setTempAttendance([...session.attendance]);
    setIsAttendanceModalOpen(true);
  };

  const toggleAttendance = (studentId: string) => {
    if (tempAttendance.includes(studentId)) {
      setTempAttendance(tempAttendance.filter(id => id !== studentId));
    } else {
      setTempAttendance([...tempAttendance, studentId]);
    }
  };

  const saveAttendance = () => {
    if (!selectedSession) return;

    // Find newly added students to deduct their quota
    const newlyAdded = tempAttendance.filter(id => !selectedSession.attendance.includes(id));
    // Find removed students to refund their quota
    const removed = selectedSession.attendance.filter(id => !tempAttendance.includes(id));

    // Update students quotas
    if (newlyAdded.length > 0 || removed.length > 0) {
      setStudents(students.map(student => {
        if (newlyAdded.includes(student.id)) {
          return { ...student, session_quota: Math.max(0, student.session_quota - 1) };
        }
        if (removed.includes(student.id)) {
          return { ...student, session_quota: student.session_quota + 1 };
        }
        return student;
      }));
    }

    // Update session
    const updatedSession = { ...selectedSession, attendance: tempAttendance };
    setSessions(sessions.map(s => s.id === updatedSession.id ? updatedSession : s));
    
    setIsAttendanceModalOpen(false);
    setSelectedSession(null);
  };

  const today = new Date().toISOString().split('T')[0];
  
  const filteredSessions = sessions.filter(s => {
    if (activeTab === 'Upcoming') return s.date >= today;
    return s.date < today;
  });

  return (
    <div className="animate-fade-in space-y-6 flex flex-col h-full relative">
      <header className="flex justify-between items-center bg-[var(--color-background)] z-10 sticky top-0 pb-4 border-b border-[var(--color-surface-border)]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-gray-400 mt-2">Schedule upcoming sessions and track attendance.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--color-secondary-500)] text-white font-bold px-4 py-2 rounded-lg hover:bg-[var(--color-secondary-600)] transition-colors shadow-[0_0_15px_var(--color-secondary-glow)] flex items-center gap-2"
        >
          <Plus size={20} /> New Session
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[var(--color-surface-border)]">
        {['Upcoming', 'Past'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'Upcoming' | 'Past')}
            className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
              activeTab === tab 
                ? 'text-[var(--color-secondary-500)]' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-secondary-500)] rounded-t-full shadow-[0_0_10px_var(--color-secondary-glow)]"></span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4 pb-12">
        {filteredSessions.length === 0 ? (
          <div className="glass-panel p-12 text-center text-gray-400 mt-8">
            <CalendarIcon className="mx-auto mb-4 opacity-50" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">No {activeTab.toLowerCase()} sessions found</h3>
            <p>Click "New Session" to schedule one.</p>
          </div>
        ) : (
          filteredSessions.map((session, i) => (
            <div key={session.id} className={`glass-panel p-6 glass-panel-hover animate-fade-in stagger-${(i % 4) + 1} flex flex-col md:flex-row gap-6 justify-between`}>
              {/* Left Side: Details */}
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    {session.title}
                    {session.date === today && (
                      <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-primary-500)]/20 text-[var(--color-primary-500)] border border-[var(--color-primary-500)]/30">
                        Today
                      </span>
                    )}
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-[var(--color-secondary-500)]" />
                    {new Date(session.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
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

              {/* Right Side: Actions */}
              <div className="flex md:flex-col justify-end gap-3 md:border-l md:border-[var(--color-surface-border)] md:pl-6">
                <button 
                  onClick={() => openAttendanceModal(session)}
                  className="bg-[var(--color-surface-hover)] border border-[var(--color-surface-border)] hover:bg-white/10 hover:border-[var(--color-primary-500)]/50 px-4 py-2 rounded-lg text-sm transition-colors text-white w-full md:w-auto flex items-center justify-center gap-2 group"
                >
                  <CheckSquare size={16} className="text-gray-400 group-hover:text-[var(--color-primary-500)] transition-colors"/> Mark Attendance
                </button>
                <button 
                  onClick={() => { setSelectedSession(session); setIsEditModalOpen(true); }}
                  className="text-gray-400 hover:text-white px-4 py-2 text-sm transition-colors w-full md:w-auto text-center"
                >
                  Edit Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
          <div className="glass-panel max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-6">Schedule New Session</h2>
            
            <form onSubmit={handleAddSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Session Title</label>
                <input required name="title" type="text" placeholder="e.g. Saturday Drills" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-secondary-500)]" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                  <input required name="date" type="date" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white outline-none focus:border-[var(--color-secondary-500)] [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Time</label>
                  <input required name="time" type="time" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-secondary-500)] [color-scheme:dark]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                  <input name="location" type="text" placeholder="e.g. Court 1" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-secondary-500)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Max Capacity</label>
                  <input name="capacity" type="number" min="1" placeholder="Optional" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-secondary-500)]" />
                </div>
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
                  className="bg-[var(--color-secondary-500)] text-white font-bold px-4 py-2 rounded-lg hover:bg-[var(--color-secondary-600)] transition-colors shadow-[0_0_15px_var(--color-secondary-glow)]"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {isEditModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
          <div className="glass-panel max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => { setIsEditModalOpen(false); setSelectedSession(null); }}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-6">Edit Session Details</h2>
            
            <form onSubmit={handleEditSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Session Title</label>
                <input required name="title" defaultValue={selectedSession.title} type="text" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-secondary-500)]" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                  <input required name="date" defaultValue={selectedSession.date} type="date" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white outline-none focus:border-[var(--color-secondary-500)] [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Time</label>
                  <input required name="time" defaultValue={selectedSession.time} type="time" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-secondary-500)] [color-scheme:dark]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                  <input name="location" defaultValue={selectedSession.location} type="text" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-secondary-500)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Max Capacity</label>
                  <input name="capacity" defaultValue={selectedSession.max_capacity || ''} type="number" min="1" className="w-full bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-secondary-500)]" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => { setIsEditModalOpen(false); setSelectedSession(null); }}
                  className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[var(--color-secondary-500)] text-white font-bold px-4 py-2 rounded-lg hover:bg-[var(--color-secondary-600)] transition-colors shadow-[0_0_15px_var(--color-secondary-glow)] flex items-center gap-2"
                >
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {isAttendanceModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
          <div className="glass-panel max-w-md w-full p-6 shadow-2xl relative border-t-2 border-[var(--color-primary-500)]">
            <button 
              onClick={() => { setIsAttendanceModalOpen(false); setSelectedSession(null); }}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <CheckSquare className="text-[var(--color-primary-500)]" /> Mark Attendance
            </h2>
            <p className="text-sm text-gray-400 mb-6">{selectedSession.title} ({selectedSession.date})</p>
            
            <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-2">
              {students.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No students available. Add some in the Students tab first.</p>
              ) : (
                students.map(student => {
                  const isChecked = tempAttendance.includes(student.id);
                  const isOutOfQuota = student.session_quota === 0;
                  
                  return (
                    <div 
                      key={student.id} 
                      onClick={() => toggleAttendance(student.id)}
                      className={`flex justify-between items-center p-3 rounded-lg border transition-colors cursor-pointer ${
                        isChecked 
                          ? 'bg-[var(--color-primary-500)]/10 border-[var(--color-primary-500)]/30' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <div className={`font-medium ${isChecked ? 'text-white' : 'text-gray-300'}`}>
                          {student.name}
                        </div>
                        <div className={`text-xs mt-1 ${isOutOfQuota && !isChecked ? 'text-[var(--color-danger-500)]' : 'text-gray-500'}`}>
                          {student.session_quota} quota remaining
                        </div>
                      </div>
                      
                      <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                        isChecked 
                          ? 'bg-[var(--color-primary-500)] border-[var(--color-primary-500)] text-gray-900' 
                          : 'border-gray-500'
                      }`}>
                        {isChecked && <CheckSquare size={14} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-[var(--color-warning-500)]/10 border border-[var(--color-warning-500)]/20 rounded-lg mb-6">
              <p className="text-xs text-[var(--color-warning-500)]">
                <strong>Note:</strong> Saving attendance will automatically deduct 1 quota from any newly checked student, and refund 1 quota to any unchecked student.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-[var(--color-surface-border)] pt-4">
              <button 
                onClick={() => { setIsAttendanceModalOpen(false); setSelectedSession(null); }}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveAttendance}
                className="bg-[var(--color-primary-500)] text-gray-900 font-bold px-4 py-2 rounded-lg hover:bg-[var(--color-primary-600)] transition-colors shadow-[0_0_15px_var(--color-primary-glow)]"
              >
                Save Attendance ({tempAttendance.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
