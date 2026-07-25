export const adminUser = {
  id: 'usr-coco',
  login_id: 'coco',
  name: '관리자',
  role: 'manager',
  position: '원장',
  hire_date: '2020-01-01',
  department: '원장실/행정',
  phone: '010-0000-0000',
  email: 'coco@cocobebe.kr',
  status: 'active',
  statutory_days: 15,
  bonus_days: 0,
  total_days: 15,
  used_days: 0,
  pending_days: 0,
  remaining_days: 15,
  calculation_note: '기본값',
  years_of_service: 6,
  months_of_service: 72,
};

export const mockUsers = [adminUser];

export const mockLeaveRequests = [];

export const mockHolidays = [
  { date: '2026-01-01', title: '신정', is_public: true, source: 'mock' },
  { date: '2026-03-01', title: '삼일절', is_public: true, source: 'mock' },
  { date: '2026-05-05', title: '어린이날', is_public: true, source: 'mock' },
];

export const mockSchedules = [];
