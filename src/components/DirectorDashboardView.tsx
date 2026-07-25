import React from 'react';
import { LeaveRequest, User } from '../types';
import { Building2, Users, CheckCircle2, Clock, AlertCircle, Scale, ShieldCheck, ArrowRight } from 'lucide-react';

interface DirectorDashboardViewProps {
  users: User[];
  leaveRequests: LeaveRequest[];
  onNavigateToApproval: () => void;
  onNavigateToTeachers: () => void;
}

export const DirectorDashboardView: React.FC<DirectorDashboardViewProps> = ({
  users,
  leaveRequests,
  onNavigateToApproval,
  onNavigateToTeachers
}) => {
  const teachers = users.filter((u) => u.role === 'teacher');
  const pendingRequests = leaveRequests.filter((r) => r.status === 'pending');
  const approvedRequests = leaveRequests.filter((r) => r.status === 'approved');

  // Calculate total granted statutory days & used days
  const totalStatutoryDays = teachers.reduce((acc, curr) => acc + curr.total_days, 0);
  const totalUsedDays = teachers.reduce((acc, curr) => acc + curr.used_days, 0);
  const totalRemainingDays = teachers.reduce((acc, curr) => acc + curr.remaining_days, 0);
  const complianceRate = totalStatutoryDays > 0 ? Math.round((totalUsedDays / totalStatutoryDays) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Executive Welcome Banner */}
      <div className="bg-[#718355] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-[#E9EDC9]">
            <Building2 className="w-4 h-4" /> 코코베베 어린이집 원장 대시보드
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            어린이집 교사 연차 관리 및 근로기준법 준수 현황
          </h2>
          <p className="text-xs text-[#E9EDC9] max-w-xl leading-relaxed">
            법정연차 자동 부여, 실시간 공휴일 연동 근무시간 산정 및 승인/복원 이력을 한눈에 총괄 관리합니다.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Staff */}
        <div className="bg-white rounded-2xl border border-[#E9EDC9] p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#718355] text-xs">
            <span>총 교직원 수</span>
            <Users className="w-4 h-4 text-[#718355]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#344E41]">{users.length}명</span>
            <span className="text-xs text-[#A3B18A]">(교사 {teachers.length}명)</span>
          </div>
          <span className="text-[11px] text-[#A3B18A] block pt-1">
            4개 학급 (열매, 새싹, 꽃잎, 영아)
          </span>
        </div>

        {/* Metric 2: Pending Requests */}
        <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#718355] text-xs">
            <span>결재 대기 중인 연차</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-700">{pendingRequests.length}건</span>
          </div>
          <button
            onClick={onNavigateToApproval}
            className="text-[11px] font-bold text-[#718355] hover:underline flex items-center gap-1 pt-1 cursor-pointer"
          >
            결재함 바로가기 <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Metric 3: Total Granted Statutory Leave */}
        <div className="bg-white rounded-2xl border border-[#E9EDC9] p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#718355] text-xs">
            <span>총 법정 연차 부여일수</span>
            <Scale className="w-4 h-4 text-[#718355]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#344E41]">{totalStatutoryDays}일</span>
            <span className="text-xs text-[#718355] font-bold">(남은 연차 {totalRemainingDays}일)</span>
          </div>
          <span className="text-[11px] text-[#A3B18A] block pt-1">
            근로기준법 제60조 기준 자동 산정
          </span>
        </div>

        {/* Metric 4: Annual Leave Compliance & Usage */}
        <div className="bg-white rounded-2xl border border-[#E9EDC9] p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#718355] text-xs">
            <span>연차 소진률</span>
            <CheckCircle2 className="w-4 h-4 text-[#718355]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#344E41]">{complianceRate}%</span>
            <span className="text-xs text-[#718355]">({totalUsedDays}일 소진)</span>
          </div>
          <div className="w-full bg-[#F1F3E9] h-1.5 rounded-full overflow-hidden mt-1">
            <div style={{ width: `${complianceRate}%` }} className="bg-[#718355] h-full rounded-full" />
          </div>
        </div>

      </div>

      {/* Recent Pending Approvals Shortcuts */}
      <div className="bg-white rounded-2xl border border-[#E9EDC9] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#344E41] text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#718355]" />
            최근 결재 승인 대기 목록
          </h3>
          <button
            onClick={onNavigateToApproval}
            className="text-xs font-bold text-[#718355] hover:underline flex items-center gap-1 cursor-pointer"
          >
            전체 결재 내역 관리 <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <p className="text-xs text-[#A3B18A] py-4 text-center">
            현재 대기 중인 연차 결재건이 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {pendingRequests.slice(0, 3).map((req) => (
              <div key={req.id} className="bg-[#F1F3E9] border border-[#E9EDC9] rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-[#344E41]">{req.user_name} 교사 ({req.department})</strong>
                  <span className="text-[#718355] block text-[11px]">{req.start_date} ~ {req.end_date} (차감: {req.requested_days}일)</span>
                </div>
                <button
                  onClick={onNavigateToApproval}
                  className="px-3 py-1 bg-[#718355] text-white font-bold rounded-lg hover:bg-[#5f6f45] text-xs cursor-pointer"
                >
                  승인 처리
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
