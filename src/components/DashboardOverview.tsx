import React from 'react';
import {
  Users,
  CalendarCheck,
  FileCheck2,
  Clock,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Building2,
  CheckCircle2,
  UserPlus,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Staff, LeaveRequest, AnnualLeavePolicy } from '../types';
import { calculateAnnualLeave } from '../utils/leaveCalculator';

interface DashboardOverviewProps {
  currentStaff: Staff;
  allStaff: Staff[];
  leaveRequests: LeaveRequest[];
  policy: AnnualLeavePolicy;
  onNavigateTab: (tabIndex: number) => void;
  onOpenAdminLogin?: () => void;
  isAdminLoggedIn?: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  currentStaff,
  allStaff,
  leaveRequests,
  policy,
  onNavigateTab,
  onOpenAdminLogin,
  isAdminLoggedIn,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Pending approvals
  const pendingRequests = leaveRequests.filter((r) => r.status === 'pending');

  // Leave calculations for all staff
  const staffLeaveCalculations = allStaff.map((staff) => ({
    staff,
    calc: calculateAnnualLeave(staff, leaveRequests, policy),
  }));

  const negativeStaffCount = staffLeaveCalculations.filter((c) => c.calc.isNegative).length;
  const totalRemainingDaysSum = staffLeaveCalculations.reduce((acc, c) => acc + c.calc.remainingDays, 0);
  const avgRemainingDays = allStaff.length > 0 ? (totalRemainingDaysSum / allStaff.length).toFixed(1) : '0.0';

  const myCalc = calculateAnnualLeave(currentStaff, leaveRequests, policy);
  const myRequests = leaveRequests.filter((r) => r.staffId === currentStaff.id);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                코코베베 어린이집 교직원 연차·휴가 관리
              </span>
              <span className="text-slate-400 text-xs font-mono">{todayStr}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              안녕하세요, <span className="text-amber-400">{currentStaff.name}</span>{' '}
              <span className="text-amber-200 text-xl font-normal">({currentStaff.positionTitle})</span>님!
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
              법정 연차 자동 산정 및 원장 승인 결재 시스템입니다. 직책별로 등록된 교직원의 휴가 현황을 확인하고 신속하게 행정을 처리하세요.
            </p>
          </div>

          {/* Quick Staff Card Summary */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-right min-w-[200px]">
            <span className="text-slate-300 text-xs block font-medium">나의 잔여 연차</span>
            <p className="text-3xl font-black text-amber-300 font-mono mt-0.5">
              {myCalc.remainingDays}일
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
              총 발생: {myCalc.totalGrantedDays}일 | 사용: {myCalc.usedDays}일
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div
          onClick={() => onNavigateTab(4)}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-500">등록된 전체 교직원</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{allStaff.length}명</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            원장, 교사, 보조교사, 야간교사 등
          </p>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => onNavigateTab(2)}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-400 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-500">결재 대기 연차</span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-100 transition-colors">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{pendingRequests.length}건</p>
          <p className="text-xs text-rose-600 font-semibold mt-1">
            {pendingRequests.length > 0 ? '원장 결재 승인 필요' : '대기 중인 신청 없음'}
          </p>
        </div>

        {/* Remaining Annual Leave Average */}
        <div
          onClick={() => onNavigateTab(1)}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-500">원내 평균 잔여 연차</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{avgRemainingDays}일</p>
          <p className="text-xs text-slate-500 mt-1">
            근속기간 기반 법정 연차 자동 산정
          </p>
        </div>

        {/* Negative Deduction Alert */}
        <div
          onClick={() => onNavigateTab(1)}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-500">연차 차감 상태</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {negativeStaffCount > 0 ? `${negativeStaffCount}명 초과` : '정상'}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            {negativeStaffCount > 0 ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                음수 연차 발생 차기 연도 이월 차감
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                음수 초과 발생 교사 없음
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Main Grid Section: Staff Roster Overview & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Annual Leave Overview Roster (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">교직원 직책별 연차 현황</h3>
              <p className="text-xs text-slate-500">
                원장, 교사, 보조교사, 연장교사, 야간반 교사, 냠냠선생님
              </p>
            </div>
            <button
              onClick={() => onNavigateTab(1)}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors cursor-pointer flex items-center gap-1"
            >
              연차 상세 현황 &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                  <th className="py-3 px-3">교사명</th>
                  <th className="py-3 px-3">선택 직책</th>
                  <th className="py-3 px-3">담당 학급</th>
                  <th className="py-3 px-3">입사일</th>
                  <th className="py-3 px-3 text-right">발생 / 사용 / 잔여</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      <p className="text-xs font-semibold mb-2">등록된 교직원이 없습니다.</p>
                      <button
                        onClick={() => onNavigateTab(4)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        신규 교직원 등록하기
                      </button>
                    </td>
                  </tr>
                ) : (
                  allStaff.map((staff) => {
                    const calc = calculateAnnualLeave(staff, leaveRequests, policy);
                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">{staff.name}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-amber-50 text-amber-900 border border-amber-200">
                            {staff.positionTitle}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{staff.className}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{staff.joinDate}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                          {calc.totalGrantedDays}일 / {calc.usedDays}일 /{' '}
                          <span className={calc.remainingDays < 0 ? 'text-rose-600 font-black' : 'text-emerald-700 font-black'}>
                            {calc.remainingDays}일
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Approvals Side Box (1 col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-900 text-sm">원장 결재 대기</h3>
              <span className="bg-rose-100 text-rose-800 font-bold text-xs px-2.5 py-0.5 rounded-full">
                {pendingRequests.length}건
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                대기 중인 연차 결재건이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-xs">
                        {req.staffName} ({req.staffRole})
                      </span>
                      <span className="text-[11px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded">
                        {req.type === 'annual' ? '전일연차' : '반차'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">
                      기간: <span className="font-medium">{req.startDate}</span> ({req.daysCount}일)
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">사유: {req.reason}</p>
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => onNavigateTab(2)}
                        className="text-xs bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        결재 처리하기 &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Policy Notice Box */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
              <Sparkles className="w-4 h-4 text-amber-600" />
              법정 연차 이월 및 음수 차감 규칙
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              남은 연차가 음수일 경우 차기 연도 부여 연차에서 자동으로 일수가 차감되며, 원장이 사용자를 추가할 때 부여된 직책(원장, 교사, 보조교사, 연장교사, 야간반 교사, 냠냠선생님)에 기반하여 연차가 산정됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
