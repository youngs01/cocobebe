export type Role = 'admin' | 'head_teacher' | 'teacher' | 'assistant' | 'cook';

export interface Staff {
  id: string;
  name: string;
  employeeNumber: string;
  role: Role;
  positionTitle: string; // 원장, 주임교사, 담임교사, 연장반교사, 보육보조, 조리사 등
  className: string;     // 햇살반, 새싹반, 열매반, 영아반, 행정 등
  joinDate: string;      // YYYY-MM-DD
  email: string;
  phone: string;
  manualAdjustment: number; // 수동 추가/차감 연차 일수
  profileImage?: string;
  status: 'active' | 'leave';
  loginId?: string;
  loginPassword?: string;
}

export type LeaveType = 'annual' | 'half_am' | 'half_pm' | 'sick' | 'event' | 'special';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  className: string;
  type: LeaveType;
  daysCount: number; // 1.0, 0.5 등
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  substituteTeacherId?: string;
  substituteTeacherName?: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectReason?: string;
  createdAt: string;
  deductedFromNextYear?: boolean; // 음수 연차 차감 대상 여부
}

export type AttendanceStatus = 'present' | 'late' | 'early_leave' | 'leave' | 'absent';

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // HH:mm
  checkOut?: string; // HH:mm
  status: AttendanceStatus;
  note?: string;
}

export interface AnnualLeavePolicy {
  negativeDeductionEnabled: boolean; // 음수 연차 발생 시 다음 년도 연차 자동 차감
  rolloverMode: 'none' | 'limited' | 'unlimited'; // 전액 소멸, 제한 이월, 무제한 이월
  maxRolloverDays: number; // 최대 이월 가능 일수
  rolloverExpiryMonths: number; // 이월 연차 사용 만료 기한 (개월)
  statutoryBaseDays: number; // 1년 이상 기준 기본 발생 연차 (15일)
  maxStatutoryDays: number; // 최대 법정 연차 한도 (25일)
}

export interface Notification {
  id: string;
  staffId: string;
  title: string;
  message: string;
  type: 'leave_approved' | 'leave_rejected' | 'announcement' | 'system';
  read: boolean;
  createdAt: string;
}

export interface DbStatus {
  connected: boolean;
  type: 'postgresql' | 'mongodb' | 'local';
  connectionString?: string;
  error?: string;
}
