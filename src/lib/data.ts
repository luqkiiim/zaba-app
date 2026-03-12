import { getSupabaseBrowserClient } from '@/lib/supabase';
import type {
  AttendanceRecord,
  Payment,
  PaymentInput,
  Session,
  SessionInput,
  Student,
  StudentInput,
} from '@/lib/types';

type SessionRow = Omit<Session, 'attendance' | 'location'> & {
  location: string | null;
};

type PaymentRow = Omit<Payment, 'amount' | 'notes'> & {
  amount: number | string;
  notes: string | null;
};

function requireSupabase() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first.',
    );
  }

  return supabase;
}

function toSession(row: SessionRow, attendance: Map<string, string[]>) {
  return {
    ...row,
    location: row.location ?? '',
    attendance: attendance.get(row.id) ?? [],
  } satisfies Session;
}

function toPayment(row: PaymentRow) {
  return {
    ...row,
    amount: Number(row.amount),
    notes: row.notes ?? '',
  } satisfies Payment;
}

export async function listStudents() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('students').select('*').order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Student[];
}

export async function createStudent(input: StudentInput) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('students')
    .insert({
      name: input.name,
      level: input.level,
      session_quota: input.session_quota,
      contact_info: input.contact_info || null,
      notes: input.notes || null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Student;
}

export async function updateStudent(id: string, input: StudentInput) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('students')
    .update({
      name: input.name,
      level: input.level,
      session_quota: input.session_quota,
      contact_info: input.contact_info || null,
      notes: input.notes || null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Student;
}

export async function listPayments() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PaymentRow[]).map(toPayment);
}

export async function createPayment(input: PaymentInput) {
  const supabase = requireSupabase();
  const { error } = await supabase.rpc('apply_payment', {
    p_student_id: input.student_id,
    p_amount: input.amount,
    p_date: input.date,
    p_type: input.type,
    p_notes: input.notes || '',
    p_added_quota: input.added_quota,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listSessions() {
  const supabase = requireSupabase();
  const [{ data: sessionRows, error: sessionError }, { data: attendanceRows, error: attendanceError }] =
    await Promise.all([
      supabase.from('sessions').select('*').order('date', { ascending: true }).order('time', { ascending: true }),
      supabase.from('attendance').select('session_id, student_id, status'),
    ]);

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (attendanceError) {
    throw new Error(attendanceError.message);
  }

  const attendanceBySession = new Map<string, string[]>();

  for (const row of (attendanceRows ?? []) as AttendanceRecord[]) {
    if (row.status !== 'Attended') {
      continue;
    }

    const studentIds = attendanceBySession.get(row.session_id) ?? [];
    studentIds.push(row.student_id);
    attendanceBySession.set(row.session_id, studentIds);
  }

  return ((sessionRows ?? []) as SessionRow[]).map((row) => toSession(row, attendanceBySession));
}

export async function createSessionRecord(input: SessionInput) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      title: input.title,
      date: input.date,
      time: input.time,
      location: input.location || null,
      max_capacity: input.max_capacity,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toSession(data as SessionRow, new Map());
}

export async function updateSessionRecord(id: string, input: SessionInput) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('sessions')
    .update({
      title: input.title,
      date: input.date,
      time: input.time,
      location: input.location || null,
      max_capacity: input.max_capacity,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SessionRow;
}

export async function syncSessionAttendance(sessionId: string, studentIds: string[]) {
  const supabase = requireSupabase();
  const { error } = await supabase.rpc('sync_session_attendance', {
    p_session_id: sessionId,
    p_student_ids: studentIds,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listDashboardData() {
  const [students, sessions, payments] = await Promise.all([listStudents(), listSessions(), listPayments()]);

  return { students, sessions, payments };
}
