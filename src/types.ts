export type UserRole = 'teacher' | 'manager' | 'director';

export interface User {
  id: string;
  login_id?: string;
  name: string;
  role: UserRole;
  position?: string; // 직책: 원장, 교사, 보조교사, 연장교사, 야간반 교사, 냠냠선생님
  hire_date: string; // YYYY-MM-DD
  department: string; // 담당 반: 0세반, 1세반, 2세반, 영아통합반, 조리실 등
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  statutory_days: number;
  bonus_days: number;
  total_days: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
  calculation_note: string;
  years_of_service: number;
  months_of_service: number;
}

export type LeaveType = 'annual' | 'half_am' | 'half_pm' | 'sick' | 'official' | 'family';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  user_id: string;
  user_name: string;
  department: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  requested_days: number;
  reason: string;
  status: LeaveStatus;
  processed_by?: string | null;
  processed_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

export interface Holiday {
  id?: number;
  date: string; // YYYY-MM-DD
  title: string;
  is_public: boolean;
  source: string;
}

export type ShiftType = 'early' | 'normal' | 'late' | 'off' | 'leave';

export interface TeacherSchedule {
  id?: number;
  user_id: string;
  user_name?: string;
  department?: string;
  date: string; // YYYY-MM-DD
  shift_type: ShiftType;
  class_name?: string;
  note?: string;
}
