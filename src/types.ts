// allow importing from import.meta.env in TypeScript

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}


export interface Teacher {
  id: number;
  name: string;
  join_date: string;
  role: 'admin' | 'director' | 'teacher' | 'assistant' | 'cook' | 'extension' | 'night_extension';
  password?: string;
  class_name?: string;
  leave_adjustment?: number; // 관리자가 수정한 연차 추가/감소 값
}

export interface LeaveRequest {
  id: number;
  teacher_id: number;
  teacher_name?: string;
  type: 'full' | 'half_am' | 'half_pm';
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  processed_by?: string;
  processed_at?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  message: string;
  is_read: number;
  created_at: string;
}
