import { Staff, LeaveRequest, AttendanceRecord, AnnualLeavePolicy, Notification } from '../types';

export const INITIAL_STAFF: Staff[] = [];

export const INITIAL_POLICY: AnnualLeavePolicy = {
  negativeDeductionEnabled: true,
  rolloverMode: 'limited',
  maxRolloverDays: 5,
  rolloverExpiryMonths: 3,
  statutoryBaseDays: 15,
  maxStatutoryDays: 25,
};

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_NOTIFICATIONS: Notification[] = [];
