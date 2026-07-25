import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  ShieldAlert,
  Sparkles,
  FileText,
  User,
  Building2,
  Info,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { Staff, LeaveRequest, LeaveType, Notification, AnnualLeavePolicy } from '../types';
import { calculateAnnualLeave } from '../utils/leaveCalculator';

interface TeacherDashboardViewProps {
  currentStaff: Staff;
  allStaff: Staff[];
  leaveRequests: LeaveRequest[];
  notifications: Notification[];
  policy: AnnualLeavePolicy;
  onSubmitLeaveRequest: (req: Partial<LeaveRequest>) => void;
  onOpenAdminLogin: () => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  currentStaff,
  allStaff,
  leaveRequests,
  notifications,
  policy,
  onSubmitLeaveRequest,
  onOpenAdminLogin,
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
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Leave calculations
  const myCalc = calculateAnnualLeave(currentStaff, leaveRequests, policy);
  const myRequests = leaveRequests.filter((r) => r.staffId === currentStaff.id);
  const otherStaff = allStaff.filter((s) => s.id !== currentStaff.id && s.role !== 'admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('연차 신청 사유를 입력해 주세요.');
      return;
    }

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
      substituteTeacherId: substituteStaffId || undefined,
      substituteTeacherName: subStaff?.name || undefined,
    });

    setReason('');
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* 교사 대시보드 상단 배너 */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-800/80 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                교사 전용 대시보드
              </span>
              <span className="text-emerald-100/80 text-xs">{currentStaff.className}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              안녕하세요, <span className="text-amber-300">{currentStaff.name}</span> 선생님!
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-xl leading-relaxed">
              오늘도 아이들과 함께 행복한 하루 보내세요. 내 연차 조회 및 연차 신청을 편리하게 이용하실 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAdminLogin}
              className="bg-slate-900/90 hover:bg-slate-900 text-amber-300 hover:text-amber-200 border border-amber-400/40 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>원장/관리자 모드 로그인</span>
            </button>
          </div>
        </div>
      </div>

      {/* 내 연차 현황 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">입사일 & 근속기간</span>
          <div className="text-lg font-bold text-slate-900 font-mono">{currentStaff.joinDate}</div>
          <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
            {myCalc.tenureYears}년차 교사
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">총 발생 연차</span>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {myCalc.statutoryDays} <span className="text-xs font-normal text-slate-500">일</span>
          </div>
          <span className="text-[11px] text-slate-400 block">법정 계산 기준</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">사용한 연차</span>
          <div className="text-2xl font-black text-rose-600 font-mono">
            {myCalc.usedDays} <span className="text-xs font-normal text-slate-500">일</span>
          </div>
          <span className="text-[11px] text-slate-400 block">승인 완료 건 포함</span>
        </div>

        <div className="bg-emerald-500 text-white p-5 rounded-2xl shadow-md space-y-1 border border-emerald-400">
          <span className="text-xs font-bold text-emerald-100 block">잔여 연차</span>
          <div className="text-3xl font-black font-mono">
            {myCalc.remainingDays} <span className="text-sm font-normal text-emerald-100">일</span>
          </div>
          <span className="text-[11px] text-emerald-100 font-medium block">
            신청 가능 연차
          </span>
        </div>
      </div>

      {/* Main Grid: 연차 신청 + 내 신청 내역 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 연차 신청 폼 (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" />
              연차 신청서 작성
            </h2>
            <span className="text-xs text-slate-400">원장 결재 요청</span>
          </div>

          {submitSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>연차 신청서가 정상 접수되었습니다! 원장님 결재 대기 중입니다.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                신청 교사
              </label>
              <input
                type="text"
                disabled
                value={`${currentStaff.name} (${currentStaff.className})`}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-600 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                연차 구분
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'annual', label: '종일 연차 (1.0일)' },
                  { id: 'half_am', label: '오전 반차 (0.5일)' },
                  { id: 'half_pm', label: '오후 반차 (0.5일)' },
                  { id: 'special', label: '경조사 휴가' },
                  { id: 'sick', label: '병가' },
                  { id: 'official', label: '공가/교육' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLeaveType(item.id as LeaveType)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      leaveType === item.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">시작일</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value > endDate) setEndDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">종료일</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                대체 교사 선택 (선택 사항)
              </label>
              <select
                value={substituteStaffId}
                onChange={(e) => setSubstituteStaffId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">-- 대체 교사 선택 안 함 --</option>
                {otherStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} 선생님 ({s.className})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                신청 사유 <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="연차 신청 사유를 입력하세요 (예: 개인 사유, 병원 진료 등)"
                rows={3}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>연차 신청서 상신하기</span>
            </button>
          </form>
        </div>

        {/* Right: 내 신청 내역 및 결재 상태 (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                나의 연차 신청 & 결재 상태
              </h2>
              <span className="text-xs font-mono font-bold text-slate-500">
                총 {myRequests.length}건
              </span>
            </div>

            {myRequests.length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <Info className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">신청한 연차 내역이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-emerald-200 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {req.startDate === req.endDate ? req.startDate : `${req.startDate} ~ ${req.endDate}`}
                        </span>
                        <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                          {req.type === 'annual' ? '종일' : req.type === 'half_am' ? '오전반차' : req.type === 'half_pm' ? '오후반차' : req.type} ({req.daysCount}일)
                        </span>
                      </div>

                      {/* 상태 Badge */}
                      {req.status === 'pending' && (
                        <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          원장 승인 대기중
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          승인 완료 ({req.approvedBy || '원장'})
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          반려됨
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      사유: {req.reason}
                    </p>

                    {req.substituteTeacherName && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                        대체 교사: <span className="font-bold text-slate-700">{req.substituteTeacherName}</span> 선생님
                      </p>
                    )}

                    {req.rejectReason && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-xl font-medium mt-1">
                        반려 사유: {req.rejectReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 안내 모듈 */}
          <div className="bg-slate-900 text-slate-200 rounded-3xl p-5 space-y-2 border border-slate-800">
            <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              근로기준법 연차 사용 유의사항
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              * 당일 연차 신청 시 반드시 사전에 원장님께 구두 보고 및 대체 교사 배정을 완료해 주세요.<br />
              * 연차승인 완료 후 부득이하게 변경이 필요한 경우, 원장님께 직접 문의해 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
