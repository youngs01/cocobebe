import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Settings,
  ShieldCheck,
  Check,
  AlertTriangle,
  Database,
  Lock,
  Sparkles,
  Save,
  RotateCcw,
  KeyRound,
} from 'lucide-react';
import { Staff, AnnualLeavePolicy, Role, DbStatus } from '../types';

interface PolicyAndStaffAdminProps {
  allStaff: Staff[];
  policy: AnnualLeavePolicy;
  dbStatus: DbStatus;
  onAddStaff: (newStaffData: Partial<Staff>) => void;
  onDeleteStaff: (id: string) => void;
  onUpdatePolicy: (newPolicy: AnnualLeavePolicy) => void;
  onOpenDbModal: () => void;
  isAdminLoggedIn?: boolean;
  onOpenAdminLogin?: () => void;
}

export const POSITION_OPTIONS = [
  '원장',
  '교사',
  '보조교사',
  '연장교사',
  '야간반 교사',
  '냠냠선생님',
] as const;

export const PolicyAndStaffAdmin: React.FC<PolicyAndStaffAdminProps> = ({
  allStaff,
  policy,
  dbStatus,
  onAddStaff,
  onDeleteStaff,
  onUpdatePolicy,
  onOpenDbModal,
  isAdminLoggedIn = true,
  onOpenAdminLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'policy' | 'permissions'>('staff');

  // New staff form state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPosition, setNewStaffPosition] = useState<string>('교사');
  const [newStaffClass, setNewStaffClass] = useState('새싹반 (만3세)');
  const [newStaffJoinDate, setNewStaffJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('010-1234-5678');
  const [showAddModal, setShowAddModal] = useState(false);

  // Policy form state
  const [localPolicy, setLocalPolicy] = useState<AnnualLeavePolicy>({ ...policy });
  const [isSaved, setIsSaved] = useState(false);

  // Helper to resolve role from position
  const getRoleFromPosition = (position: string): Role => {
    if (position === '원장') return 'admin';
    if (position === '보조교사') return 'assistant';
    if (position === '냠냠선생님') return 'cook';
    return 'teacher';
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName) return;

    const assignedRole = getRoleFromPosition(newStaffPosition);

    onAddStaff({
      name: newStaffName,
      role: assignedRole,
      positionTitle: newStaffPosition,
      className: newStaffClass,
      joinDate: newStaffJoinDate,
      email: newStaffEmail || `${newStaffName}@cocobebe.child.kr`,
      phone: newStaffPhone,
      manualAdjustment: 0,
    });

    setNewStaffName('');
    setShowAddModal(false);
  };

  const handleSavePolicy = () => {
    onUpdatePolicy(localPolicy);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-slate-900 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono">
              ADMIN CONTROL
            </span>
            <span className="text-xs text-slate-500">원장 및 관리자 전용 대시보드</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">사용자 및 연차 행정 관리</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            교직원 신규 등록(직책 선택), 명단 관리, 연차 이월 및 차감 정책 설정
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'staff' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> 교직원 관리 ({allStaff.length})
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'policy' ? 'bg-white shadow-xs text-amber-800' : 'text-slate-600'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> 연차 이월/차감 정책
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'permissions' ? 'bg-white shadow-xs text-indigo-800' : 'text-slate-600'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> 권한 안내
          </button>
        </div>
      </div>

      {/* Admin credentials info bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold text-amber-300">관리자 인증 계정:</span> 아이디{' '}
            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-200 font-mono font-bold">cocobebe</code> / 비밀번호{' '}
            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-200 font-mono font-bold">Dbsgofks03!</code>
          </div>
        </div>
        {onOpenAdminLogin && (
          <button
            onClick={onOpenAdminLogin}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
          >
            {isAdminLoggedIn ? '관리자 로그인 상태' : '관리자 계정 로그인'}
          </button>
        )}
      </div>

      {/* Staff Management Tab */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">코코베베 어린이집 교직원 명단</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              신규 교직원 등록
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                    <th className="py-3.5 px-4">사번 / 성명</th>
                    <th className="py-3.5 px-4">선택 직책</th>
                    <th className="py-3.5 px-4">담당 학급/부서</th>
                    <th className="py-3.5 px-4">입사일</th>
                    <th className="py-3.5 px-4">연락처 / 이메일</th>
                    <th className="py-3.5 px-4 text-center">직원 삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        등록된 교직원이 없습니다. 신규 교직원을 등록하세요.
                      </td>
                    </tr>
                  ) : (
                    allStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{staff.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {staff.employeeNumber}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-block ${
                            staff.positionTitle === '원장'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : staff.positionTitle === '교사'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : staff.positionTitle === '보조교사'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : staff.positionTitle === '연장교사'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : staff.positionTitle === '야간반 교사'
                              ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                              : 'bg-orange-50 text-orange-800 border border-orange-200'
                          }`}>
                            {staff.positionTitle}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-800">{staff.className}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{staff.joinDate}</td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          <div>{staff.phone}</div>
                          <div className="text-[10px] text-slate-400">{staff.email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {staff.role !== 'admin' ? (
                            <button
                              onClick={() => {
                                if (confirm(`${staff.name} 교사를 정말 삭제하시겠습니까?`)) {
                                  onDeleteStaff(staff.id);
                                }
                              }}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="직원 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-400">
                              원장 (보호)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Policy Options Tab */}
      {activeTab === 'policy' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-600" />
              법정 연차 음수 차감 및 이월 상세 설정
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              원내 휴가 운영 규정에 맞게 연차 소멸, 이월 제한, 음수 차감 연동 옵션을 지정합니다.
            </p>
          </div>

          <div className="space-y-6 max-w-2xl">
            {/* Negative Deduction Option */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 flex items-start gap-4">
              <input
                type="checkbox"
                id="negDeduction"
                checked={localPolicy.negativeDeductionEnabled}
                onChange={(e) =>
                  setLocalPolicy({ ...localPolicy, negativeDeductionEnabled: e.target.checked })
                }
                className="mt-1 w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
              />
              <div>
                <label htmlFor="negDeduction" className="font-bold text-slate-900 text-xs cursor-pointer">
                  남은 연차가 음수(-)일 때 다음 년도 연차에서 자동 차감
                </label>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  활성화 시, 당해 연도 발생 연차보다 많은 연차를 사용하여 잔여 일수가 음수가 되면 다음 해 새로 부여되는 법정 연차에서 해당 일수만큼 자동으로 차감 적용됩니다.
                </p>
              </div>
            </div>

            {/* Rollover Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                연차 이월 정책 선택
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    localPolicy.rolloverMode === 'none'
                      ? 'bg-slate-900 text-white font-bold border-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="rolloverMode"
                    value="none"
                    checked={localPolicy.rolloverMode === 'none'}
                    onChange={() => setLocalPolicy({ ...localPolicy, rolloverMode: 'none' })}
                    className="sr-only"
                  />
                  <span>전액 소멸 (미사용 소멸)</span>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    localPolicy.rolloverMode === 'limited'
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="rolloverMode"
                    value="limited"
                    checked={localPolicy.rolloverMode === 'limited'}
                    onChange={() => setLocalPolicy({ ...localPolicy, rolloverMode: 'limited' })}
                    className="sr-only"
                  />
                  <span>제한 이월 허용</span>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    localPolicy.rolloverMode === 'unlimited'
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="rolloverMode"
                    value="unlimited"
                    checked={localPolicy.rolloverMode === 'unlimited'}
                    onChange={() => setLocalPolicy({ ...localPolicy, rolloverMode: 'unlimited' })}
                    className="sr-only"
                  />
                  <span>무제한 이월</span>
                </label>
              </div>
            </div>

            {/* Limit parameters if limited */}
            {localPolicy.rolloverMode === 'limited' && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    최대 이월 가능 일수 (일)
                  </label>
                  <input
                    type="number"
                    value={localPolicy.maxRolloverDays}
                    onChange={(e) =>
                      setLocalPolicy({ ...localPolicy, maxRolloverDays: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    이월 연차 사용 만료 기간 (개월)
                  </label>
                  <input
                    type="number"
                    value={localPolicy.rolloverExpiryMonths}
                    onChange={(e) =>
                      setLocalPolicy({
                        ...localPolicy,
                        rolloverExpiryMonths: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleSavePolicy}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4 text-amber-400" />
                설정 저장 적용
              </button>
              {isSaved && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> 성공적으로 저장되었습니다!
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security Roles & Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">직책별 권한 및 인가 정보</h3>
          <p className="text-xs text-slate-500">
            직책 선택 옵션: <span className="font-bold text-slate-800">원장, 교사, 보조교사, 연장교사, 야간반 교사, 냠냠선생님</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <span className="font-bold text-amber-400 text-sm">원장 (관리자)</span>
                <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-bold">
                  전권 인가
                </span>
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                <li>✓ 모든 교직원 연차 승인/반려 결재</li>
                <li>✓ 연차 이월 및 차감 정책 설정</li>
                <li>✓ 신규 교직원 등록 (직책 선택) 및 삭제</li>
                <li>✓ 월별 근태 보고서 PDF 다운로드</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 text-sm">교사 / 연장교사 / 야간반 교사</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                  담임 및 돌봄
                </span>
              </div>
              <ul className="space-y-1.5 text-slate-600 text-[11px]">
                <li>✓ 잔여 연차 실시간 확인</li>
                <li>✓ 모바일/데스크톱 연차 결재 신청</li>
                <li>✓ 대치 교사 지정 및 인수인계</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 text-sm">보조교사 / 냠냠선생님</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  지원 및 급식
                </span>
              </div>
              <ul className="space-y-1.5 text-slate-600 text-[11px]">
                <li>✓ 법정 연차 자동 계산 및 신청</li>
                <li>✓ 원장 결재 결과 즉시 알림</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 text-slate-900">
            <h3 className="font-bold text-slate-900 text-base">신규 교직원 등록</h3>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">성명 (필수)</label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="예: 김민지"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">직책 선택 (필수)</label>
                <select
                  value={newStaffPosition}
                  onChange={(e) => setNewStaffPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 bg-amber-50/40 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 cursor-pointer"
                >
                  {POSITION_OPTIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">담당 학급 / 부서</label>
                <input
                  type="text"
                  value={newStaffClass}
                  onChange={(e) => setNewStaffClass(e.target.value)}
                  placeholder="예: 새싹반 (만3세)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">입사일 (연차 산정 기준)</label>
                <input
                  type="date"
                  value={newStaffJoinDate}
                  onChange={(e) => setNewStaffJoinDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">이메일</label>
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="teacher@cocobebe.kr"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">연락처</label>
                  <input
                    type="text"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                ✨ 직책 선택에 맞춰 권한과 연차 산정이 자동으로 적용되며, 교직원 본인이 로그인하여 자신의 대시보드를 확인할 수 있습니다.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  직원 저장 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
