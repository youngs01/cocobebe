import React, { useState, useEffect } from 'react';
import { User, UserRole, LeaveRequest, Holiday, TeacherSchedule, LeaveType } from './types';
import { Header } from './components/Header';
import { LoginForm } from './components/LoginForm';
import { LaborLawInfoModal } from './components/LaborLawInfoModal';
import { LeaveRequestModal } from './components/LeaveRequestModal';
import { LeaveApprovalPanel } from './components/LeaveApprovalPanel';
import { TeacherManagementPanel } from './components/TeacherManagementPanel';
import { CalendarScheduleView } from './components/CalendarScheduleView';
import { DirectorDashboardView } from './components/DirectorDashboardView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PlusCircle, Calendar, CheckCircle2, Clock, RotateCcw, AlertCircle, Sparkles, Building2, UserCheck, ShieldCheck, FileText, ChevronRight, Scale } from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);

  // Authentication State (NO AUTO LOGIN - Must login with ID & Password)
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('my_leave');

  const [dbConnected, setDbConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSyncingNaver, setIsSyncingNaver] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(new Date().toISOString());

  const [isLaborModalOpen, setIsLaborModalOpen] = useState<boolean>(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);

  const formatDate = (d?: string | null) => {
    if (!d) return '';
    if (typeof d === 'string') return d.split('T')[0];
    try { return new Date(d as any).toISOString().split('T')[0]; } catch { return '' }
  };

  const computeTenure = (hireDateRaw?: string | null) => {
    if (!hireDateRaw) return { years: 0, months: 0 };
    const datePart = typeof hireDateRaw === 'string' && hireDateRaw.includes('T') ? hireDateRaw.split('T')[0] : hireDateRaw;
    const start = new Date(`${datePart}T00:00:00Z`);
    const now = new Date();
    let totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) totalMonths -= 1;
    totalMonths = Math.max(0, totalMonths);
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return { years, months };
  };

  // Fetch all data from Express PostgreSQL Backend
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, reqsRes, holRes, schRes, healthRes] = await Promise.all([
        fetch('/api/users').then(r => r.json()),
        fetch('/api/leave-requests').then(r => r.json()),
        fetch('/api/holidays').then(r => r.json()),
        fetch('/api/schedules').then(r => r.json()),
        fetch('/api/health').then(r => r.json()).catch(() => ({ dbConnected: false }))
      ]);

      const fetchedUsers = Array.isArray(usersRes) ? usersRes : [];
      const fetchedLeaveRequests = Array.isArray(reqsRes) ? reqsRes : [];
      const fetchedHolidays = Array.isArray(holRes) ? holRes : [];
      const fetchedSchedules = Array.isArray(schRes) ? schRes : [];

      setUsers(fetchedUsers);
      setLeaveRequests(fetchedLeaveRequests);
      setHolidays(fetchedHolidays);
      setSchedules(fetchedSchedules);
      if (healthRes && typeof healthRes.dbConnected === 'boolean') {
        setDbConnected(healthRes.dbConnected);
      }

      // Sync currently loggedInUser with fresh user data if logged in
      if (loggedInUser) {
        const fresh = fetchedUsers.find((u: User) => u.id === loggedInUser.id);
        if (fresh) setLoggedInUser(fresh);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLoginSuccess = (user: User) => {
    setLoggedInUser(user);
    if (user.role === 'director') setActiveTab('director_dashboard');
    else if (user.role === 'manager') setActiveTab('approval');
    else setActiveTab('my_leave');
    // 필수 데이터만 먼저 로드 (더 빠른 로그인)
    fetchEssentialData();
  };

  // 로그인 후 필수 데이터 빠르게 로드
  const fetchEssentialData = async () => {
    try {
      setIsLoading(true);
      // users와 leave-requests만 먼저 로드 (필수)
      const [usersRes, reqsRes] = await Promise.all([
        fetch('/api/users').then(r => r.json()),
        fetch('/api/leave-requests').then(r => r.json())
      ]);
      
      const fetchedUsers = Array.isArray(usersRes) ? usersRes : [];
      const fetchedLeaveRequests = Array.isArray(reqsRes) ? reqsRes : [];
      
      setUsers(fetchedUsers);
      setLeaveRequests(fetchedLeaveRequests);
      
      // holidays와 schedules는 백그라운드에서 나중에 로드
      loadOptionalData();
    } catch (err) {
      console.error('Failed to fetch essential data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 선택 데이터 백그라운드 로드 (holidays, schedules)
  const loadOptionalData = async () => {
    try {
      const [holRes, schRes, healthRes] = await Promise.all([
        fetch('/api/holidays').then(r => r.json()),
        fetch('/api/schedules').then(r => r.json()),
        fetch('/api/health').then(r => r.json()).catch(() => ({ dbConnected: false }))
      ]);
      
      const fetchedHolidays = Array.isArray(holRes) ? holRes : [];
      const fetchedSchedules = Array.isArray(schRes) ? schRes : [];
      
      setHolidays(fetchedHolidays);
      setSchedules(fetchedSchedules);
    } catch (err) {
      console.error('Failed to fetch optional data:', err);
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
  };

  // Selected User Object (matching loggedInUser)
  const currentUser: User = loggedInUser
    ? (users.find(u => u.id === loggedInUser.id) || loggedInUser)
    : {
        id: 'usr-guest',
        name: '미로그인',
        role: 'teacher',
        hire_date: '2026-01-01',
        department: '영아반',
        phone: '010-0000-0000',
        email: 'guest@cocobebe.kr',
        status: 'active',
        statutory_days: 15,
        bonus_days: 0,
        total_days: 15,
        used_days: 0,
        pending_days: 0,
        remaining_days: 15,
        calculation_note: '',
        years_of_service: 0,
        months_of_service: 0
      };

  const currentRole = currentUser.role;

  // Sync Naver Calendar Public Holidays
  const handleSyncNaverHolidays = async () => {
    try {
      setIsSyncingNaver(true);
      const res = await fetch('/api/holidays/sync-naver', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLastSyncedTime(data.lastSyncedAt);
        await fetchData();
      }
    } catch (err) {
      console.error('Naver sync error:', err);
    } finally {
      setIsSyncingNaver(false);
    }
  };

  // Submit Leave Request
  const handleSubmitLeaveRequest = async (reqData: {
    user_id: string;
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    requested_days: number;
    reason: string;
  }) => {
    const res = await fetch('/api/leave-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    alert(data.message);
    await fetchData();
  };

  // Approve Leave Request
  const handleApproveLeave = async (requestId: string) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/leave-requests/${requestId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          processed_by: `${currentRole === 'director' ? '원장' : '관리자'} ${currentUser.name}`
        })
      });
      const data = await res.json();
      alert(data.message);
      await fetchData();
    } catch (err: any) {
      alert(err.message || '승인 처리 실패');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject Leave Request
  const handleRejectLeave = async (requestId: string, reason: string) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/leave-requests/${requestId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          processed_by: `${currentRole === 'director' ? '원장' : '관리자'} ${currentUser.name}`,
          rejection_reason: reason
        })
      });
      const data = await res.json();
      alert(data.message);
      await fetchData();
    } catch (err: any) {
      alert(err.message || '반려 처리 실패');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel Approved Leave Request (RESTORE LEAVE DAYS)
  const handleCancelApprovedLeave = async (requestId: string) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/leave-requests/${requestId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          processed_by: `${currentRole === 'director' ? '원장' : '관리자'} ${currentUser.name}`
        })
      });
      const data = await res.json();
      alert(data.message);
      await fetchData();
    } catch (err: any) {
      alert(err.message || '승인 취소 및 연차 복원 실패');
    } finally {
      setIsProcessing(false);
    }
  };

  // Add New Teacher
  const handleAddTeacher = async (teacherData: any) => {
    try {
      setIsProcessing(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      await fetchData();
    } finally {
      setIsProcessing(false);
    }
  };

  // Update Teacher / Staff Info
  const handleUpdateTeacher = async (id: string, updatedData: any) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 로컬 상태 업데이트 (API 응답 사용)
      if (data.user) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data.user } : u));
      }
      alert(data.message || '교직원 정보가 업데이트되었습니다.');
    } catch (err: any) {
      alert(err.message || '교직원 정보 수정 실패');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Teacher Account
  const handleDeleteTeacher = async (id: string) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/users/${id}?requesterRole=${currentRole}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      await fetchData();
    } catch (err: any) {
      alert(err.message || '교사 계정 삭제 실패');
    } finally {
      setIsProcessing(false);
    }
  };

  // Recalculate Statutory Leave for user
  const handleRecalculateLeave = async (id: string) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/users/${id}/recalculate-leave`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`[근로기준법 연차 재산정 완료]\n${data.note}`);
        await fetchData();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Save Schedule Shift
  const handleSaveSchedule = async (scheduleData: any) => {
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData)
    });
    const data = await res.json();
    alert(data.message);
    await fetchData();
  };

  // Add Custom Red Day / Holiday
  const handleAddHoliday = async (holidayData: { date: string; title: string }) => {
    try {
      setIsProcessing(true);
      const normalizedHoliday = {
        date: holidayData.date,
        title: holidayData.title.trim(),
        is_public: true,
        source: 'manual' as const
      };

      // 로컬 상태 먼저 업데이트 (즉시 화면 반영)
      setHolidays(prev => {
        const withoutSameDate = prev.filter(item => item.date !== normalizedHoliday.date);
        return [...withoutSameDate, normalizedHoliday].sort((a, b) => a.date.localeCompare(b.date));
      });

      // 그 다음 서버에 저장
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayData)
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await res.json();
          throw new Error(data.error || '휴일 등록 실패');
        } else {
          throw new Error('서버 응답 오류 - 잠시 후 다시 시도해주세요.');
        }
      }

      const data = await res.json();
      alert('휴일이 추가되었습니다.');
    } catch (err: any) {
      // 실패하면 로컬 상태 원상복구
      setHolidays(prev => prev.filter(item => item.date !== holidayData.date));
      alert(err.message || '휴일 등록 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete / Unset Red Day
  const handleDeleteHoliday = async (date: string) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/holidays/${encodeURIComponent(date)}`, { method: 'DELETE' });

      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await res.json();
          throw new Error(data.error || '휴일 삭제 실패');
        }
        throw new Error('서버 응답 오류 - 잠시 후 다시 시도해주세요.');
      }

      const data = await res.json();
      setHolidays(prev => prev.filter(item => item.date !== date));
      alert(data.message || '휴일이 삭제되었습니다.');
    } catch (err: any) {
      await fetchData();
      alert(err.message || '휴일 해제 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Pending count for badge
  const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;

  if (!loggedInUser) {
    return (
      <LoginForm
        onLoginSuccess={handleLoginSuccess}
        dbConnected={dbConnected}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#344E41] font-sans pb-20 md:pb-10">
      
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onOpenLaborLawModal={() => setIsLaborModalOpen(true)}
        dbConnected={dbConnected}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Navigation Tabs for Desktop */}
        <div className="hidden md:flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#E9EDC9] shadow-xs">
          
          <button
            onClick={() => setActiveTab('my_leave')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'my_leave'
                ? 'bg-[#718355] text-white shadow-xs'
                : 'text-[#344E41]/80 hover:bg-[#F1F3E9]'
            }`}
          >
            내 연차 & 신청
          </button>

          {(currentRole === 'manager' || currentRole === 'director') && (
            <button
              onClick={() => setActiveTab('approval')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                activeTab === 'approval'
                  ? 'bg-[#718355] text-white shadow-xs'
                  : 'text-[#344E41]/80 hover:bg-[#F1F3E9]'
              }`}
            >
              결재 승인 관리
              {pendingCount > 0 && (
                <span className="ml-1.5 bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-[#718355] text-white shadow-xs'
                : 'text-[#344E41]/80 hover:bg-[#F1F3E9]'
            }`}
          >
            어린이집 달력 (빨간날 자동인식)
          </button>

          {(currentRole === 'manager' || currentRole === 'director') && (
            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'teachers'
                  ? 'bg-[#718355] text-white shadow-xs'
                  : 'text-[#344E41]/80 hover:bg-[#F1F3E9]'
              }`}
            >
              교사 명부 & 계정 삭제
            </button>
          )}

          {currentRole === 'director' && (
            <button
              onClick={() => setActiveTab('director_dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'director_dashboard'
                  ? 'bg-[#718355] text-white shadow-xs'
                  : 'text-[#344E41]/80 hover:bg-[#F1F3E9]'
              }`}
            >
              원장 대시보드
            </button>
          )}

        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-[#E9EDC9] p-12 text-center text-[#718355] text-xs font-medium space-y-2">
            <div className="w-8 h-8 border-4 border-[#718355] border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Neon PostgreSQL 데이터베이스에서 교사 연차 정보를 동기화하고 있습니다...</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: My Leave & Submit Request */}
            {activeTab === 'my_leave' && (
              <div className="space-y-6">
                
                {/* Profile Card Banner */}
                <div className="bg-white rounded-3xl border border-[#E9EDC9] p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#E9EDC9] border border-[#A3B18A]/40 flex items-center justify-center text-[#718355] font-black text-xl shrink-0 shadow-xs">
                      {currentUser.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-[#344E41]">{currentUser.name} 교사</h2>
                        <span className="bg-[#F1F3E9] text-[#718355] text-xs px-2.5 py-0.5 rounded-full font-semibold border border-[#E9EDC9]">
                          {currentUser.department}
                        </span>
                      </div>
                      <p className="text-xs text-[#718355] mt-1 flex items-center gap-2">
                        <span>입사일: {formatDate(currentUser.hire_date)}</span>
                        <span>•</span>
                        {(() => {
                          const years = typeof currentUser.years_of_service === 'number' ? currentUser.years_of_service : computeTenure(currentUser.hire_date).years;
                          const months = typeof currentUser.months_of_service === 'number' ? currentUser.months_of_service : computeTenure(currentUser.hire_date).months;
                          return (
                            <span className="text-[#344E41] font-semibold">
                              근속 {years > 0 ? `${years}년차 (${months}개월)` : `${months}개월차`}
                            </span>
                          );
                        })()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="px-6 py-3 bg-[#718355] hover:bg-[#5f6f45] text-white font-bold text-sm rounded-2xl shadow-md shadow-[#718355]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-5 h-5" />
                    새 연차 / 휴가 신청하기
                  </button>
                </div>

                {/* Annual Leave Gauge Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <div className="bg-white rounded-2xl border border-[#E9EDC9] p-5 shadow-xs space-y-1">
                    <span className="text-xs text-[#718355] font-medium block">2026년 총 법정 부여 연차</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-[#344E41]">{currentUser.total_days}일</span>
                    </div>
                    <p className="text-[11px] text-[#A3B18A] pt-1">근로기준법 제60조 기준</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#A3B18A] p-5 shadow-xs space-y-1">
                    <span className="text-xs text-[#718355] font-medium block">사용 / 승인 완료 연차</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-[#344E41]">{currentUser.used_days}일</span>
                    </div>
                    <p className="text-[11px] text-[#718355] pt-1">결재 승인 및 소진완료</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs space-y-1">
                    <span className="text-xs text-amber-800 font-medium block">결재 대기 중인 연차</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-amber-700">{currentUser.pending_days}일</span>
                    </div>
                    <p className="text-[11px] text-amber-700 pt-1">원장/관리자 승인 대기</p>
                  </div>

                  <div className="bg-[#718355] rounded-2xl p-5 text-white shadow-md space-y-1">
                    <span className="text-xs text-[#E9EDC9] font-medium block">현재 남은 법정 연차</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black">{currentUser.remaining_days}일</span>
                    </div>
                    <p className="text-[11px] text-[#E9EDC9] pt-1">즉시 사용 신청 가능</p>
                  </div>

                </div>

                {/* My Leave Request History */}
                <div className="bg-white rounded-3xl border border-[#E9EDC9] p-6 shadow-xs space-y-4">
                  <h3 className="font-bold text-[#344E41] text-base flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#718355]" />
                    나의 연차 신청 및 승인 이력
                  </h3>

                  {leaveRequests.filter(r => r.user_id === currentUser.id).length === 0 ? (
                    <div className="text-center py-10 text-[#A3B18A] text-xs border border-dashed border-[#E9EDC9] rounded-2xl">
                      아직 신청한 연차가 없습니다. 상단의 '새 연차 / 휴가 신청하기' 버튼을 눌러보세요.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {leaveRequests
                        .filter(r => r.user_id === currentUser.id)
                        .map(req => (
                          <div key={req.id} className="bg-[#FDFCF8] rounded-2xl border border-[#E9EDC9] p-4 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#344E41] text-sm">{formatDate(req.start_date)} ~ {formatDate(req.end_date)}</span>
                                <span className="bg-[#E9EDC9] text-[#344E41] px-2 py-0.5 rounded font-bold">{req.requested_days}일 차감</span>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                                req.status === 'approved' ? 'bg-[#F1F3E9] text-[#718355] border border-[#E9EDC9]' :
                                req.status === 'pending' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                                req.status === 'cancelled' ? 'bg-slate-200 text-slate-700' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {req.status === 'approved' ? '승인완료' : req.status === 'pending' ? '승인대기' : req.status === 'cancelled' ? '승인취소(연차복원됨)' : '반려됨'}
                              </span>
                            </div>
                            <p className="text-[#344E41]/80">사유: {req.reason || '사유 미기재'}</p>
                            {req.processed_by && (
                              <p className="text-[11px] text-[#A3B18A] pt-1 border-t border-[#E9EDC9]">
                                처리자: {req.processed_by} ({new Date(req.processed_at || '').toLocaleDateString('ko-KR')})
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* VIEW 2: Approval Panel */}
            {activeTab === 'approval' && (
              <LeaveApprovalPanel
                leaveRequests={leaveRequests}
                currentUser={currentUser}
                onApprove={handleApproveLeave}
                onReject={handleRejectLeave}
                onCancelApproved={handleCancelApprovedLeave}
                isProcessing={isProcessing}
              />
            )}

            {/* VIEW 3: Daycare Calendar */}
            {activeTab === 'calendar' && (
              <CalendarScheduleView
                holidays={holidays}
                schedules={schedules}
                users={users}
                currentUser={currentUser}
                onSaveSchedule={handleSaveSchedule}
                onAddHoliday={handleAddHoliday}
                onDeleteHoliday={handleDeleteHoliday}
              />
            )}

            {/* VIEW 4: Teacher Management & Account Deletion */}
            {activeTab === 'teachers' && (
              <TeacherManagementPanel
                users={users}
                currentUser={currentUser}
                onAddTeacher={handleAddTeacher}
                onUpdateTeacher={handleUpdateTeacher}
                onDeleteTeacher={handleDeleteTeacher}
                onRecalculateLeave={handleRecalculateLeave}
                isProcessing={isProcessing}
              />
            )}

            {/* VIEW 5: Director Dashboard */}
            {activeTab === 'director_dashboard' && (
              <DirectorDashboardView
                users={users}
                leaveRequests={leaveRequests}
                onNavigateToApproval={() => setActiveTab('approval')}
                onNavigateToTeachers={() => setActiveTab('teachers')}
              />
            )}
          </>
        )}

      </main>

      {/* Mobile Touch Bottom Nav */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        currentRole={currentRole}
        pendingCount={pendingCount}
      />

      {/* Modals */}
      <LaborLawInfoModal
        isOpen={isLaborModalOpen}
        onClose={() => setIsLaborModalOpen(false)}
      />

      <LeaveRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        currentUser={currentUser}
        holidays={holidays}
        onSubmit={handleSubmitLeaveRequest}
      />

    </div>
  );
}
