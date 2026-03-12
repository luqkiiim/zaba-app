export type StudentLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';

export type PaymentType = 'Quota Top-up' | 'Monthly Fee' | 'Other';

export type AttendanceStatus = 'Attended' | 'Cancelled' | 'No Show';

export interface Student {
  id: string;
  name: string;
  level: StudentLevel;
  session_quota: number;
  notes: string | null;
  contact_info: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  max_capacity: number | null;
  created_at: string;
  attendance: string[];
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  date: string;
  type: PaymentType;
  notes: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
}

export interface StudentInput {
  name: string;
  level: StudentLevel;
  session_quota: number;
  notes: string;
  contact_info: string;
}

export interface SessionInput {
  title: string;
  date: string;
  time: string;
  location: string;
  max_capacity: number | null;
}

export interface PaymentInput {
  student_id: string;
  amount: number;
  date: string;
  type: PaymentType;
  notes: string;
  added_quota: number;
}
