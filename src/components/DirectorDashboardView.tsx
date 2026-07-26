import React, { useState } from 'react';
import { LeaveRequest, User, Holiday } from '../types';
import { Building2, Users, CheckCircle2, Clock, AlertCircle, Scale, ShieldCheck, ArrowRight, Calendar, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DirectorDashboardViewProps {
  users: User[];
  leaveRequests: LeaveRequest[];
  holidays: Holiday[];
  onNavigateToApproval: () => void;
  onNavigateToTeachers: () => void;
  onAddHoliday?: (data: { date: string; title: string }) => Promise<void>;
  onDeleteHoliday?: (date: string) => Promise<void>;
}

export const DirectorDashboardView: React.FC<DirectorDashboardViewProps> = ({
  users,
  leaveRequests,
  holidays,
  onNavigateToApproval,
  onNavigateToTeachers,
  onAddHoliday,
  onDeleteHoliday
}) => {
  const [newHolidayDate, setNewHolidayDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [newHolidayTitle, setNewHolidayTitle] = useState<string>('');
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  
  const teachers = users.filter((u) => u.role === 'teacher');
  const pendingRequests = leaveRequests.filter((r) => r.status === 'pending');
  const approvedRequests = leaveRequests.filter((r) => r.status === 'approved');

  const formatDate = (d?: string | null) => {
    if (!d) return '';
    if (typeof d === 'string') return d.split('T')[0];
    try { return new Date(d as any).toISOString().split('T')[0]; } catch { return '' }
  };

  // Calculate total granted statutory days & used days
  const totalStatutoryDays = teachers.reduce((acc, curr) => acc + curr.total_days, 0);
  const totalUsedDays = teachers.reduce((acc, curr) => acc + curr.used_days, 0);
  const totalRemainingDays = teachers.reduce((acc, curr) => acc + curr.remaining_days, 0);
  const complianceRate = totalStatutoryDays > 0 ? Math.round((totalUsedDays / totalStatutoryDays) * 100) : 0;

  // 정규화된 공휴일
  const normalizedHolidays = holidays.map(h => ({
    ...h,
    date: h.date.includes('T') ? h.date.split('T')[0] : h.date
  })).filter(h => h.is_public);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayTitle.trim()) {
      alert('날짜와 공휴일/대체휴일 명칭을 입력해 주세요.');
      return;
    }
    try {
      setIsAddingHoliday(true);
      if (onAddHoliday) {
        await onAddHoliday({ date: newHolidayDate, title: newHolidayTitle.trim() });
        setNewHolidayTitle('');
        setNewHolidayDate(format(new Date(), 'yyyy-MM-dd'));
      }
    } catch (err: any) {
      alert('공휴일 등록 실패: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setIsAddingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (dateStr: string) => {
    if (window.confirm(`${dateStr} 공휴일/대체휴일을 삭제하시겠습니까?`)) {
      try {
        if (onDeleteHoliday) {
          await onDeleteHoliday(dateStr);
        }
      } catch (err: any) {
        alert('공휴일 삭제 실패: ' + (err.message || '알 수 없는 오류'));
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Executive Welcome Banner */}
      <div className="bg-[#718355] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] sm:text-xs font-bold text-[#E9EDC9]">
            <Building2 className="w-3 h-3 sm:w-4 sm:h-4" /> 코코베베 어린이집 원장 대시보드
          </div>
          <h2 className="text-lg sm:text-2xl font-black tracking-tight leading-tight">
            어린이집 교사 연차 관리 및 근로기준법 준수 현황
          </h2>
          <p className="text-[11px] sm:text-xs text-[#E9EDC9] max-w-xl leading-relaxed">
            법정연차 자동 부여, 실시간 공휴일 연동 근무시간 산정 및 승인/복원 이력을 한눈에 총괄 관리합니다.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1: Total Staff */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E9EDC9] p-3 sm:p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#718355] text-[11px] sm:text-xs">
            <span>총 교직원 수</span>
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-[#718355]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-[#344E41]">{users.length}명</span>
            <span className="text-[10px] sm:text-xs text-[#A3B18A]">(교사 {teachers.length}명)</span>
          </div>
        </div>

        {/* Metric 2: Pending Requests */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-amber-200 p-3 sm:p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#718355] text-[11px] sm:text-xs">
            <span>결재 대기</span>
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-amber-700">{pendingRequests.length}건</span>
          </div>
          <button
            onClick={onNavigateToApproval}
            className="text-[10px] sm:text-[11px] font-bold text-[#718355] hover:underline flex items-center gap-1 pt-1 cursor-pointer"
          >
            결재함 바로가기 <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Metric 3: Total Granted Statutory Leave */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E9EDC9] p-3 sm:p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#718355] text-[11px] sm:text-xs">
            <span>총 법정연차</span>
            <Scale className="w-3 h-3 sm:w-4 sm:h-4 text-[#718355]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-[#344E41]">{totalStatutoryDays}일</span>
            <span className="text-[10px] sm:text-xs text-[#718355] font-bold">(남은 {totalRemainingDays}일)</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-[#A3B18A] block pt-1">
            근로기준법 제60조
          </span>
        </div>

        {/* Metric 4: Annual Leave Compliance & Usage */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E9EDC9] p-3 sm:p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#718355] text-[11px] sm:text-xs">
            <span>연차 소진률</span>
            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-[#718355]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-[#344E41]">{complianceRate}%</span>
            <span className="text-[10px] sm:text-xs text-[#718355]">({totalUsedDays}일)</span>
          </div>
          <div className="w-full bg-[#F1F3E9] h-1.5 rounded-full overflow-hidden mt-1">
            <div style={{ width: `${complianceRate}%` }} className="bg-[#718355] h-full rounded-full" />
          </div>
        </div>

      </div>

      {/* Recent Pending Approvals Shortcuts */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E9EDC9] p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-bold text-[#344E41] text-xs sm:text-sm flex items-center gap-2 flex-wrap">
            <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-[#718355]" />
            <span>최근 결재 대기 목록</span>
          </h3>
          <button
            onClick={onNavigateToApproval}
            className="text-[10px] sm:text-xs font-bold text-[#718355] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            전체 관리 <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <p className="text-[11px] sm:text-xs text-[#A3B18A] py-4 text-center">
            현재 대기 중인 연차 결재건이 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {pendingRequests.slice(0, 3).map((req) => (
              <div key={req.id} className="bg-[#F1F3E9] border border-[#E9EDC9] rounded-lg sm:rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] sm:text-xs">
                <div className="flex-1 min-w-0">
                  <strong className="text-[#344E41] block text-xs sm:text-sm truncate">{req.user_name} 교사 ({req.department})</strong>
                  <span className="text-[#718355] block text-[10px] sm:text-[11px]">{formatDate(req.start_date)} ~ {formatDate(req.end_date)} (차감: {req.requested_days}일)</span>
                </div>
                <button
                  onClick={onNavigateToApproval}
                  className="px-3 py-2 bg-[#718355] text-white font-bold rounded-lg hover:bg-[#5f6f45] text-[11px] sm:text-xs cursor-pointer shrink-0 w-full sm:w-auto"
                >
                  승인 처리
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Holiday Management Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E9EDC9] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-bold text-[#344E41] text-xs sm:text-sm flex items-center gap-2 flex-wrap">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-[#718355]" />
            <span>공휴일 및 대체 공휴일 관리</span>
          </h3>
          <span className="text-[10px] sm:text-xs bg-[#F1F3E9] text-[#718355] px-2.5 py-1 rounded-lg font-bold whitespace-nowrap">
            등록됨: {normalizedHolidays.length}개
          </span>
        </div>

        {/* Add Holiday Form */}
        <form onSubmit={handleAddHoliday} className="bg-[#F1F3E9] border border-[#E9EDC9] rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-[#344E41] mb-1.5">날짜 선택 *</label>
              <input
                type="date"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                className="w-full border border-[#E9EDC9] rounded-lg px-3 py-2 text-[11px] sm:text-xs text-[#344E41] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#718355]/30"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-[#344E41] mb-1.5">명칭 *</label>
              <input
                type="text"
                placeholder="예: 대체 공휴일"
                value={newHolidayTitle}
                onChange={(e) => setNewHolidayTitle(e.target.value)}
                maxLength={30}
                className="w-full border border-[#E9EDC9] rounded-lg px-3 py-2 text-[11px] sm:text-xs text-[#344E41] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#718355]/30"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isAddingHoliday}
            className="w-full px-4 py-2.5 sm:py-2 bg-[#718355] text-white font-bold text-xs sm:text-xs rounded-lg hover:bg-[#5f6f45] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {isAddingHoliday ? '등록 중...' : '공휴일 등록'}
          </button>
        </form>

        {/* Holiday List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {normalizedHolidays.length === 0 ? (
            <p className="text-[11px] sm:text-xs text-[#A3B18A] py-4 text-center">등록된 공휴일/대체휴일이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {normalizedHolidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((holiday) => (
                <div
                  key={holiday.date}
                  className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] sm:text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-rose-800 break-all">{holiday.title}</div>
                    <div className="text-rose-700 text-[10px] sm:text-[11px]">
                      {format(parseISO(holiday.date), 'yyyy년 M월 d일 (eee)', { locale: ko })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(holiday.date)}
                    className="px-2.5 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors text-[10px] cursor-pointer shrink-0 w-full sm:w-auto"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
