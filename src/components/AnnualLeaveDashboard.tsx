import React, { useState } from 'react';
import {
  Calendar,
  AlertCircle,
  Plus,
  Minus,
  Info,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  Edit,
  ArrowDownRight,
} from 'lucide-react';
import { Staff, LeaveRequest, AnnualLeavePolicy } from '../types';
import { calculateAnnualLeave } from '../utils/leaveCalculator';

interface AnnualLeaveDashboardProps {
  allStaff: Staff[];
  leaveRequests: LeaveRequest[];
  policy: AnnualLeavePolicy;
  onUpdateStaffAdjustment: (staffId: string, adjustment: number) => void;
}

export const AnnualLeaveDashboard: React.FC<AnnualLeaveDashboardProps> = ({
  allStaff,
  leaveRequests,
  policy,
  onUpdateStaffAdjustment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [detailModalStaff, setDetailModalStaff] = useState<Staff | null>(null);

  // Filter staff list
  const filteredStaff = allStaff.filter((staff) => {
    const matchesSearch =
      staff.name.includes(searchTerm) ||
      staff.positionTitle.includes(searchTerm) ||
      staff.className.includes(searchTerm);
    const matchesClass = selectedClass === 'all' || staff.className.includes(selectedClass);
    return matchesSearch && matchesClass;
  });

  const handleOpenAdjustment = (staff: Staff) => {
    setEditingStaff(staff);
    setAdjustmentValue(staff.manualAdjustment || 0);
  };

  const handleSaveAdjustment = () => {
    if (editingStaff) {
      onUpdateStaffAdjustment(editingStaff.id, adjustmentValue);
      setEditingStaff(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Statutory Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-slate-900 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md font-mono">
              근로기준법 제60조 기준
            </span>
            <span className="text-xs text-slate-500">법정 연차 자동 계산 엔진</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            코코베베 교직원 법정 연차 사용 및 잔여 대시보드
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            입사일 기준 근속 연수 자동 계산, 잔여 연차 음수 시 다음 년도 자동 차감 설정 연동
          </p>
        </div>

        {/* Policy Quick Summary Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            음수 차감: {policy.negativeDeductionEnabled ? '자동 적용 중' : '미적용'}
          </div>
          <div className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-medium">
            이월 정책: {policy.rolloverMode === 'limited' ? `최대 ${policy.maxRolloverDays}일 이월` : '전액 소멸'}
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="교사명, 직위, 학급 검색..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-medium whitespace-nowrap">학급 필터:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white cursor-pointer"
          >
            <option value="all">전체 학급</option>
            <option value="햇살반">햇살반 (만5세)</option>
            <option value="새싹반">새싹반 (만3세)</option>
            <option value="열매반">열매반 (만4세)</option>
            <option value="꽃잎반">꽃잎반 (만2세)</option>
            <option value="영아반">영아반 (만1세)</option>
            <option value="급식실">급식실</option>
            <option value="행정">원장실/행정</option>
          </select>
        </div>
      </div>

      {/* Annual Leave Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                <th className="py-3.5 px-4">교사명 / 직위</th>
                <th className="py-3.5 px-4">담당 학급</th>
                <th className="py-3.5 px-4">입사일</th>
                <th className="py-3.5 px-4">근속기간</th>
                <th className="py-3.5 px-4">법정 발생</th>
                <th className="py-3.5 px-4">수동 조정</th>
                <th className="py-3.5 px-4">총 부여</th>
                <th className="py-3.5 px-4">사용 연차</th>
                <th className="py-3.5 px-4">잔여 연차</th>
                <th className="py-3.5 px-4">음수 차감 상태</th>
                <th className="py-3.5 px-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500 text-xs font-semibold">
                    등록되었거나 조건에 해당하는 교직원이 없습니다. [사용자 및 정책 행정] 탭에서 신규 교직원을 등록하세요.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const calc = calculateAnnualLeave(staff, leaveRequests, policy);
                  return (
                    <tr key={staff.id} className="hover:bg-amber-50/30 transition-colors">
                    {/* Staff Name & Position */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                          {staff.name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{staff.name}</p>
                          <p className="text-[10px] text-slate-500">{staff.positionTitle}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">{staff.className}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{staff.joinDate}</td>

                    {/* Tenure */}
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {calc.leaveDetails.tenureDescription}
                    </td>

                    {/* Statutory Days */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 font-mono">
                      {calc.statutoryDays}일
                    </td>

                    {/* Manual Adjustment */}
                    <td className="py-3.5 px-4 font-mono">
                      {calc.manualAdjustment > 0 ? (
                        <span className="text-emerald-600 font-bold">+{calc.manualAdjustment}일</span>
                      ) : calc.manualAdjustment < 0 ? (
                        <span className="text-rose-600 font-bold">{calc.manualAdjustment}일</span>
                      ) : (
                        <span className="text-slate-400">0일</span>
                      )}
                    </td>

                    {/* Total Granted */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      {calc.totalGrantedDays}일
                    </td>

                    {/* Used Days */}
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                      {calc.usedDays}일
                    </td>

                    {/* Remaining Days */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-mono font-bold text-sm px-2 py-0.5 rounded-lg inline-block ${
                          calc.remainingDays < 0
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : calc.remainingDays <= 3
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {calc.remainingDays}일
                      </span>
                    </td>

                    {/* Negative Deduction Status */}
                    <td className="py-3.5 px-4">
                      {calc.isNegative ? (
                        <div className="flex items-center gap-1 text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          다음 해 {calc.nextYearDeduction}일 자동 차감
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">정상</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setDetailModalStaff(staff)}
                          className="px-2 py-1 text-[11px] bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium cursor-pointer"
                          title="산정 내역 상세보기"
                        >
                          상세
                        </button>
                        <button
                          onClick={() => handleOpenAdjustment(staff)}
                          className="px-2 py-1 text-[11px] bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-lg font-bold cursor-pointer"
                          title="수동 연차 추가/차감"
                        >
                          조정
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Edit className="w-4 h-4 text-amber-600" />
              {editingStaff.name} 교사 수동 연차 조정
            </h3>
            <p className="text-xs text-slate-500">
              포상 연차 부여(+) 또는 미지급/차감(-) 일수를 조정하세요.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                수동 조정 연차 일수 (음수 가능)
              </label>
              <input
                type="number"
                step="0.5"
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSaveAdjustment}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Breakdown Modal */}
      {detailModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200">
            {(() => {
              const calc = calculateAnnualLeave(detailModalStaff, leaveRequests, policy);
              return (
                <>
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {detailModalStaff.name} 교사 법정 연차 상세 산정 내역
                      </h3>
                      <p className="text-xs text-slate-500">
                        {detailModalStaff.positionTitle} ({detailModalStaff.className}) | 입사일:{' '}
                        {detailModalStaff.joinDate}
                      </p>
                    </div>
                    <button
                      onClick={() => setDetailModalStaff(null)}
                      className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Calculation Details List */}
                  <div className="space-y-3 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-800">근로기준법 적용 조항</p>
                      <p className="text-slate-600 leading-relaxed">{calc.leaveDetails.lawArticleNotice}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <span className="text-slate-500 block text-[11px]">법정 산정 연차</span>
                        <span className="font-bold text-amber-900 text-lg font-mono">
                          {calc.statutoryDays}일
                        </span>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <span className="text-slate-500 block text-[11px]">사용 승인된 연차</span>
                        <span className="font-bold text-emerald-900 text-lg font-mono">
                          {calc.usedDays}일
                        </span>
                      </div>
                    </div>

                    {/* Approved Requests Logs */}
                    <div>
                      <h4 className="font-bold text-slate-800 mb-2">연차 사용 상세 내역</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1.5">
                        {leaveRequests
                          .filter((r) => r.staffId === detailModalStaff.id && r.status === 'approved')
                          .map((req) => (
                            <div
                              key={req.id}
                              className="p-2.5 bg-slate-50 rounded-lg flex justify-between items-center text-[11px]"
                            >
                              <div>
                                <span className="font-bold text-slate-800">
                                  {req.startDate} ~ {req.endDate}
                                </span>
                                <span className="text-slate-500 block">{req.reason}</span>
                              </div>
                              <span className="font-mono font-bold text-rose-600">
                                -{req.daysCount}일
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setDetailModalStaff(null)}
                      className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer"
                    >
                      확인 완료
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
