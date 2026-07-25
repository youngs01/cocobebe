import React, { useState } from 'react';
import {
  Smartphone,
  Calendar,
  Send,
  Bell,
  CheckCircle2,
  Sparkles,
  Baby,
  UserCheck,
} from 'lucide-react';
import { Staff, LeaveRequest, LeaveType, Notification, AnnualLeavePolicy } from '../types';
import { calculateAnnualLeave } from '../utils/leaveCalculator';

interface MobileStaffViewProps {
  currentStaff: Staff;
  allStaff: Staff[];
  leaveRequests: LeaveRequest[];
  notifications: Notification[];
  policy: AnnualLeavePolicy;
  onSubmitLeaveRequest: (req: Partial<LeaveRequest>) => void;
}

export const MobileStaffView: React.FC<MobileStaffViewProps> = ({
  currentStaff,
  allStaff,
  leaveRequests,
  notifications,
  policy,
  onSubmitLeaveRequest,
}) => {
  const [leaveType, setLeaveType] = useState<LeaveType>('annual');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [reason, setReason] = useState('');
  const [substituteStaffId, setSubstituteStaffId] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  const myCalc = calculateAnnualLeave(currentStaff, leaveRequests, policy);
  const myRequests = leaveRequests.filter((r) => r.staffId === currentStaff.id);
  const myNotifications = notifications.filter((n) => n.staffId === currentStaff.id);

  const otherStaff = allStaff.filter((s) => s.id !== currentStaff.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    const subStaff = allStaff.find((s) => s.id === substituteStaffId);

    onSubmitLeaveRequest({
      staffId: currentStaff.id,
      staffName: currentStaff.name,
      staffRole: currentStaff.positionTitle,
      className: currentStaff.className,
      type: leaveType,
      daysCount: leaveType === 'annual' ? 1.0 : leaveType.startsWith('half') ? 0.5 : 1.0,
      startDate,
      endDate,
      reason,
      substituteTeacherId: substituteStaffId,
      substituteTeacherName: subStaff?.name,
    });

    setReason('');
    setSubmittedMessage(true);
    setTimeout(() => setSubmittedMessage(false), 3000);
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 rounded-[40px] p-4 shadow-2xl border-4 border-slate-800 my-4">
      {/* Smartphone Frame Inner Screen */}
      <div className="bg-slate-50 min-h-[640px] rounded-[32px] overflow-hidden flex flex-col justify-between text-slate-900">
        {/* Mobile Header Bar */}
        <div className="bg-amber-500 text-slate-950 p-4 pt-6 space-y-2 shadow-xs">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Baby className="w-5 h-5" />
              <span className="font-extrabold text-sm tracking-tight">코코베베 교사 전용 모바일</span>
            </div>
            <span className="text-[10px] bg-slate-950 text-amber-300 font-bold px-2 py-0.5 rounded-full">
              교직원
            </span>
          </div>

          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl flex items-center justify-between text-xs border border-white">
            <div>
              <p className="font-bold text-slate-900 text-sm">{currentStaff.name} 선생님</p>
              <p className="text-[11px] text-amber-900 font-semibold">
                {currentStaff.positionTitle} ({currentStaff.className})
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">잔여 연차</span>
              <span className="font-black text-amber-700 text-base font-mono">
                {myCalc.remainingDays}일
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Mobile Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[500px]">
          {/* Recent Approval Toast Notification */}
          {myNotifications.length > 0 && !myNotifications[0].read && (
            <div className="bg-emerald-600 text-white p-3 rounded-2xl text-xs shadow-md animate-bounce flex items-start gap-2">
              <Bell className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{myNotifications[0].title}</p>
                <p className="text-[11px] text-emerald-100">{myNotifications[0].message}</p>
              </div>
            </div>
          )}

          {/* Leave Application Form */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              모바일 간편 휴가 신청
            </h3>

            {submittedMessage && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                휴가 신청이 원장 결재로 접수되었습니다!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  휴가 구분
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-xs cursor-pointer font-medium"
                >
                  <option value="annual">전일 연차 (1.0일)</option>
                  <option value="half_am">오전 반차 (0.5일)</option>
                  <option value="half_pm">오후 반차 (0.5일)</option>
                  <option value="sick">병가</option>
                  <option value="event">경조사 휴가</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  인수인계 대치교사 지정
                </label>
                <select
                  value={substituteStaffId}
                  onChange={(e) => setSubstituteStaffId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs cursor-pointer"
                >
                  <option value="">대치교사 선택 (선택)</option>
                  {otherStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.positionTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  신청 사유
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="예: 개인 사정 병원 진료"
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                원장 결재 신청 제출
              </button>
            </form>
          </div>

          {/* My Leave Application History */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs">나의 휴가 신청 및 결재 상태</h4>
            <div className="space-y-2 text-xs">
              {myRequests.length === 0 ? (
                <p className="text-slate-400 text-[11px] text-center py-2">
                  신청한 휴가 내역이 없습니다.
                </p>
              ) : (
                myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-[11px]">
                        {req.startDate} ({req.daysCount}일)
                      </p>
                      <p className="text-[10px] text-slate-500">{req.reason}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status === 'approved'
                        ? '승인완료'
                        : req.status === 'rejected'
                        ? '반려됨'
                        : '결재대기'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Footer */}
        <div className="p-3 bg-white border-t border-slate-200 text-center text-[10px] text-slate-400">
          코코베베 어린이집 교직원 모바일 대시보드 v2.5
        </div>
      </div>
    </div>
  );
};
