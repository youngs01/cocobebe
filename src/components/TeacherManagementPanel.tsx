import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { UserPlus, Trash2, RefreshCw, Phone, Building2, Search, Edit3, Shield, Tag } from 'lucide-react';

interface TeacherManagementPanelProps {
  users: User[];
  currentUser: User;
  onAddTeacher: (data: {
    name: string;
    hire_date: string;
    department: string;
    position: string;
    phone?: string;
    email?: string;
    role?: UserRole;
    login_id?: string;
    password?: string;
  }) => Promise<void>;
  onUpdateTeacher: (id: string, data: {
    name: string;
    department: string;
    position: string;
    phone?: string;
    email?: string;
    hire_date?: string;
    role?: UserRole;
  }) => Promise<void>;
  onDeleteTeacher: (id: string) => Promise<void>;
  onRecalculateLeave: (id: string) => Promise<void>;
  isProcessing: boolean;
}

const POSITION_OPTIONS = [
  '원장',
  '교사',
  '보조교사',
  '연장교사',
  '야간반 교사',
  '냠냠선생님'
];
function calculateTenure(hireDate: string) {
  // Extract date part only (YYYY-MM-DD)
  const datePart = hireDate.includes('T') ? hireDate.split('T')[0] : hireDate;
  const start = new Date(`${datePart}T00:00:00Z`);
  const now = new Date();
  const totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  const years = Math.max(0, Math.floor(totalMonths / 12));
  const months = Math.max(0, totalMonths % 12);
  return { years, months };
}
export const TeacherManagementPanel: React.FC<TeacherManagementPanelProps> = ({
  users,
  currentUser,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onRecalculateLeave,
  isProcessing
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  // Form states for NEW teacher
  const [newLoginId, setNewLoginId] = useState('');
  const [newPassword, setNewPassword] = useState('1234');
  const [newName, setNewName] = useState('');
  const [newHireDate, setNewHireDate] = useState('2026-03-01');
  const [newDept, setNewDept] = useState('');
  const [newPosition, setNewPosition] = useState('교사');
  const [newPhone, setNewPhone] = useState('010-1234-5678');
  const [newRole, setNewRole] = useState<UserRole>('teacher');

  // Form states for EDITING teacher
  const [editName, setEditName] = useState('');
  const [editHireDate, setEditHireDate] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editPosition, setEditPosition] = useState('교사');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('teacher');

  const filteredUsers = users.filter((u) => {
    return (
      u.name.includes(searchTerm) ||
      u.department.includes(searchTerm) ||
      (u.position && u.position.includes(searchTerm))
    );
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newHireDate) {
      alert('이름과 입사일을 입력해 주세요.');
      return;
    }

    const finalDept = newDept.trim();
    if (!finalDept) {
      alert('담당 반/부서를 입력해 주세요.');
      return;
    }

    try {
      await onAddTeacher({
        login_id: newLoginId.trim() || undefined,
        password: newPassword.trim() || '1234',
        name: newName,
        hire_date: newHireDate,
        department: finalDept,
        position: newPosition,
        phone: newPhone,
        role: newPosition === '원장' ? 'director' : newRole
      });
      setIsAddModalOpen(false);
      setNewName('');
      setNewLoginId('');
      setNewPassword('1234');
      setNewDept('');
    } catch (err: any) {
      alert(err.message || '등록 중 오류가 발생했습니다.');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    // hire_date를 YYYY-MM-DD 형식으로 변환 (date input용)
    const hireDatePart = user.hire_date.includes('T') ? user.hire_date.split('T')[0] : user.hire_date;
    setEditHireDate(hireDatePart);
    setEditDept(user.department || '');
    setEditPosition(user.position || (user.role === 'director' ? '원장' : '교사'));
    setEditPhone(user.phone || '');
    setEditEmail(user.email || '');
    setEditRole(user.role);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editName.trim()) {
      alert('교직원 이름을 입력해 주세요.');
      return;
    }

    const finalDept = editDept.trim();
    if (!finalDept) {
      alert('담당 반/부서를 입력해 주세요.');
      return;
    }

    try {
      await onUpdateTeacher(editingUser.id, {
        name: editName.trim(),
        department: finalDept,
        position: editPosition,
        phone: editPhone,
        email: editEmail,
        hire_date: editHireDate,
        role: editPosition === '원장' ? 'director' : editRole
      });
      setEditingUser(null);
    } catch (err: any) {
      alert(err.message || '교직원 정보 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (user: User) => {
    const confirmMessage = `⚠️ [교사 계정 삭제 확인]\n\n교사명: ${user.name} (${user.position || '교사'}, ${user.department})\n입사일: ${user.hire_date}\n\n정말로 이 교사 계정을 삭제하시겠습니까?\n삭제 시 관련 연차 신청 내역 및 스케줄이 함께 정리됩니다.`;
    if (window.confirm(confirmMessage)) {
      await onDeleteTeacher(user.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            어린이집 교직원 명부 및 담당 반/직책 관리
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            0세~2세 영아반, 조리실, 보조/연장/야간반/냠냠선생님 담당 반 등록 및 수정 지원 • 근로기준법 자동 연차 계산
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl hover:bg-amber-600 transition-colors shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          신규 교직원 등록 (담당 반 지정)
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-[#F1F3E9] p-3 rounded-xl border border-[#E9EDC9]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#A3B18A] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="교직원 이름, 담당 반, 또는 직책 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs border border-[#E9EDC9] rounded-lg pl-9 pr-3 py-1.5 text-[#344E41] focus:outline-hidden focus:ring-2 focus:ring-[#718355] bg-white"
          />
        </div>
        <span className="text-xs text-[#718355] font-semibold">
          총 {filteredUsers.length}명 교직원
        </span>
      </div>

      {/* Teacher Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((u) => {
          const displayPosition = u.position || (u.role === 'director' ? '원장' : '교사');
          const { years: tenureYears, months: tenureMonths } = calculateTenure(u.hire_date);
          return (
            <div
              key={u.id}
              className="bg-white rounded-2xl border border-[#E9EDC9] hover:border-[#718355] transition-all p-4 space-y-3 shadow-xs hover:shadow-md"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-[#344E41] text-base">{u.name}</h3>
                    <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-[#E9EDC9] text-[#344E41] border border-[#A3B18A] shadow-2xs">
                      {displayPosition}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-[#718355]">
                    <Tag className="w-3.5 h-3.5 text-[#718355]" />
                    <span className="font-bold text-[#344E41]">담당 반: {u.department}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Edit Teacher Info Button */}
                  {(currentUser.role === 'manager' || currentUser.role === 'director' || currentUser.id === u.id) && (
                    <button
                      onClick={() => openEditModal(u)}
                      className="p-1.5 text-[#718355] hover:text-[#344E41] hover:bg-[#F1F3E9] rounded-xl transition-colors border border-transparent hover:border-[#E9EDC9] cursor-pointer"
                      title="담당 반 / 직책 수정"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete Teacher Account Button (관리자 / 원장 권한) */}
                  {(currentUser.role === 'manager' || currentUser.role === 'director') && u.role === 'teacher' && (
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={isProcessing}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                      title="교사 계정 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Legal Service Tenure Box */}
              <div className="bg-[#FDFCF8] rounded-xl p-2.5 border border-[#E9EDC9] text-xs space-y-1">
                <div className="flex justify-between text-[#718355]">
                  <span>입사일:</span>
                  <strong className="text-[#344E41]">{u.hire_date.includes('T') ? u.hire_date.split('T')[0] : u.hire_date}</strong>
                </div>
                <div className="flex justify-between text-[#718355]">
                  <span>근속기간:</span>
                  <strong className="text-[#344E41] font-bold">
                    {tenureYears > 0
                      ? `${tenureYears}년차 (${tenureMonths}개월)`
                      : `${tenureMonths}개월차 (1년미만)`}
                  </strong>
                </div>
              </div>

              {/* Annual Leave Gauge */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-[#344E41]">법정 연차 현황</span>
                  <span className="text-[#718355]">남은 연차 {u.remaining_days}일</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#F1F3E9] h-2.5 rounded-full overflow-hidden flex border border-[#E9EDC9]">
                  <div
                    style={{ width: `${Math.min(100, (u.used_days / (u.total_days || 1)) * 100)}%` }}
                    className="bg-[#718355] h-full"
                    title={`사용: ${u.used_days}일`}
                  />
                  <div
                    style={{ width: `${Math.min(100, (u.pending_days / (u.total_days || 1)) * 100)}%` }}
                    className="bg-amber-400 h-full"
                    title={`대기: ${u.pending_days}일`}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-[#718355] pt-0.5">
                  <span>
                    총 법정 부여: <strong>{u.total_days}일</strong>
                  </span>
                  <span>
                    사용: <strong>{u.used_days}일</strong>
                  </span>
                  <span>
                    승인대기: <strong>{u.pending_days}일</strong>
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-2 border-t border-[#E9EDC9] flex items-center justify-between text-xs text-[#718355]">
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-[#A3B18A]" />
                  <span className="text-[11px]">{u.phone}</span>
                </div>

                <button
                  onClick={() => onRecalculateLeave(u.id)}
                  disabled={isProcessing}
                  className="text-[#718355] hover:text-[#344E41] text-[11px] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  연차 재계산
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Teacher Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E9EDC9] w-full max-w-md overflow-hidden">
            <div className="bg-[#F1F3E9] px-6 py-4 border-b border-[#E9EDC9] flex items-center justify-between">
              <h3 className="font-bold text-[#344E41] text-base">신규 교직원 등록</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#A3B18A] hover:text-[#344E41] text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-[#344E41] mb-1">로그인 아이디</label>
                  <input
                    type="text"
                    placeholder="자동 생성 (직접 입력 가능)"
                    value={newLoginId}
                    onChange={(e) => setNewLoginId(e.target.value)}
                    className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41] focus:ring-2 focus:ring-[#718355]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#344E41] mb-1">초기 비밀번호</label>
                  <input
                    type="text"
                    placeholder="초기값: 1234"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41] focus:ring-2 focus:ring-[#718355]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#344E41] mb-1">교직원 이름 *</label>
                <input
                  type="text"
                  placeholder="예: 김소영"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41] focus:ring-2 focus:ring-[#718355]"
                  required
                />
              </div>

              {/* 직책 선택 (원장, 교사, 보조교사, 연장교사, 야간반 교사, 냠냠선생님) */}
              <div>
                <label className="block font-bold text-[#344E41] mb-1">직책 선택 *</label>
                <select
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41] font-bold focus:ring-2 focus:ring-[#718355]"
                >
                  {POSITION_OPTIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              {/* 담당 반 입력 */}
              <div>
                <label className="block font-bold text-[#344E41] mb-1">담당 반 / 부서 입력 *</label>
                <input
                  type="text"
                  placeholder="예: 영아반, 햇살반, 원장실, 조리실 등"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41] font-bold focus:ring-2 focus:ring-[#718355]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#344E41] mb-1">입사일 (연차 산정 기준일) *</label>
                <input
                  type="date"
                  value={newHireDate}
                  onChange={(e) => setNewHireDate(e.target.value)}
                  className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41] focus:ring-2 focus:ring-[#718355]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#344E41] mb-1">연락처</label>
                <input
                  type="text"
                  placeholder="010-0000-0000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#344E41] mb-1">시스템 승인 권한</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41]"
                >
                  <option value="teacher">일반 교직원 (연차 신청)</option>
                  <option value="manager">관리자 (승인 권한)</option>
                  <option value="director">원장 (전체 승인/관리)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#E9EDC9] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#E9EDC9] rounded-xl font-semibold text-[#344E41]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-[#718355] text-white font-bold rounded-xl hover:bg-[#5f6f45] cursor-pointer"
                >
                  등록 및 법정연차 자동생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Information Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E9EDC9] w-full max-w-md overflow-hidden">
            <div className="bg-[#F1F3E9] px-6 py-4 border-b border-[#E9EDC9] flex items-center justify-between">
              <h3 className="font-bold text-[#344E41] text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#718355]" />
                {editingUser.name} 교직원 정보 수정
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-[#A3B18A] hover:text-[#344E41] text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#344E41] mb-1">교직원 이름 *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41] font-bold focus:ring-2 focus:ring-[#718355]"
                  required
                />
              </div>

              {/* 직책 수정 */}
              <div>
                <label className="block font-bold text-[#344E41] mb-1">직책 수정 *</label>
                <select
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41] font-bold focus:ring-2 focus:ring-[#718355]"
                >
                  {POSITION_OPTIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              {/* 담당 반 수정 */}
              <div>
                <label className="block font-bold text-[#344E41] mb-1">담당 반 / 부서 수정 *</label>
                <input
                  type="text"
                  placeholder="예: 영아반, 햇살반, 원장실, 조리실 등"
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41] font-bold focus:ring-2 focus:ring-[#718355]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#344E41] mb-1">입사일 (수정 시 연차 자동 재계산)</label>
                <input
                  type="date"
                  value={editHireDate}
                  onChange={(e) => setEditHireDate(e.target.value)}
                  className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41] focus:ring-2 focus:ring-[#718355]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#344E41] mb-1">연락처</label>
                <input
                  type="text"
                  placeholder="010-0000-0000"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#344E41] mb-1">이메일</label>
                <input
                  type="email"
                  placeholder="email@cocobebe.kr"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#344E41] mb-1">시스템 권한</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41]"
                >
                  <option value="teacher">교사 (일반)</option>
                  <option value="manager">관리자 (승인 권한)</option>
                  <option value="director">원장 (전체 관리)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#E9EDC9] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-[#E9EDC9] rounded-xl font-semibold text-[#344E41]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-[#718355] text-white font-bold rounded-xl hover:bg-[#5f6f45] cursor-pointer"
                >
                  정보 수정 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
