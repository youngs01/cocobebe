import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  FileCheck2,
  FileText,
  Settings,
  Clock,
  Smartphone,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { Staff, LeaveRequest, AnnualLeavePolicy, Notification, DbStatus } from './types';
import { INITIAL_STAFF, INITIAL_LEAVE_REQUESTS, INITIAL_POLICY, INITIAL_NOTIFICATIONS } from './data/initialData';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { AnnualLeaveDashboard } from './components/AnnualLeaveDashboard';
import { LeaveApprovalCenter } from './components/LeaveApprovalCenter';
import { MonthlyPdfReport } from './components/MonthlyPdfReport';
import { PolicyAndStaffAdmin } from './components/PolicyAndStaffAdmin';
import { MobileStaffView } from './components/MobileStaffView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { TeacherDashboardView } from './components/TeacherDashboardView';

const DEFAULT_ADMIN_STAFF: Staff = {
  id: 'admin-cocobebe',
  name: '관리자',
  employeeNumber: 'ADMIN-001',
  role: 'admin',
  positionTitle: '원장',
  className: '원장실 / 행정',
  joinDate: new Date().toISOString().split('T')[0],
  email: 'cocobebe@cocobebe.child.kr',
  phone: '010-0000-0000',
  manualAdjustment: 0,
  status: 'active',
};

export default function App() {
  const [allStaff, setAllStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [currentStaff, setCurrentStaff] = useState<Staff>(INITIAL_STAFF[0] || DEFAULT_ADMIN_STAFF);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [policy, setPolicy] = useState<AnnualLeavePolicy>(INITIAL_POLICY);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const [dbStatus, setDbStatus] = useState<DbStatus>({
    connected: true,
    type: 'postgresql',
    connectionString: 'postgresql://neondb_owner:****@ep-aged-bar-a7n8l724-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  });

  const [activeTab, setActiveTab] = useState<number>(0);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false); // Starts unauthenticated - user must log in via modal
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch initial data from backend API
  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [staffRes, leaveRes, policyRes, notifRes, dbRes] = await Promise.all([
        fetch('/api/staff').then((r) => r.json()).catch(() => []),
        fetch('/api/leave-requests').then((r) => r.json()).catch(() => []),
        fetch('/api/policy').then((r) => r.json()).catch(() => INITIAL_POLICY),
        fetch('/api/notifications').then((r) => r.json()).catch(() => []),
        fetch('/api/db/status').then((r) => r.json()).catch(() => ({
          connected: false,
          type: 'local',
          connectionString: 'mongodb+srv://sinhan2023_db_user:<db_password>@cluster0.auyca0i.mongodb.net/?appName=Cluster0',
        })),
      ]);

      if (Array.isArray(staffRes)) {
        setAllStaff(staffRes);
        if (staffRes.length > 0) {
          if (!currentStaff || currentStaff.id === 'admin-cocobebe' || !staffRes.find((s) => s.id === currentStaff.id)) {
            setCurrentStaff(staffRes[0]);
          }
        } else {
          setCurrentStaff(DEFAULT_ADMIN_STAFF);
        }
      }
      if (Array.isArray(leaveRes)) setLeaveRequests(leaveRes);
      if (policyRes && policyRes.statutoryBaseDays) setPolicy(policyRes);
      if (Array.isArray(notifRes)) setNotifications(notifRes);
      if (dbRes) setDbStatus(dbRes);
    } catch (e) {
      console.warn('API Fetch error, fallback to memory store:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handlers for Staff Management
  const handleAddStaff = async (newStaffData: Partial<Staff>) => {
    try {
      await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaffData),
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStaff = async (id: string, updateData: Partial<Staff>) => {
    try {
      await fetch(`/api/staff/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAllStaff((prev) => prev.filter((s) => s.id !== id));
        fetchAllData();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`교사 삭제에 실패했습니다: ${errData.error || '오류 발생'}`);
      }
    } catch (err) {
      console.error(err);
      alert('교사 삭제 중 네트워크 오류가 발생했습니다.');
    }
  };

  const handleUpdateStaffAdjustment = async (staffId: string, manualAdjustment: number) => {
    try {
      await fetch(`/api/staff/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualAdjustment }),
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitLeaveRequest = async (req: Partial<LeaveRequest>) => {
    try {
      await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveLeave = async (id: string, approvedBy: string) => {
    try {
      await fetch(`/api/leave-requests/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', approvedBy }),
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectLeave = async (id: string, approvedBy: string, rejectReason: string) => {
    try {
      await fetch(`/api/leave-requests/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', approvedBy, rejectReason }),
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePolicy = async (newPolicy: AnnualLeavePolicy) => {
    try {
      await fetch('/api/policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPolicy),
      });
      setPolicy(newPolicy);
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const pendingCount = leaveRequests.filter((r) => r.status === 'pending').length;
  const isUserAdminOrDirector =
    isAdminLoggedIn || currentStaff?.role === 'admin' || currentStaff?.positionTitle === '원장';

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-amber-200">
      {/* Top Header */}
      <Header
        currentStaff={currentStaff}
        allStaff={allStaff}
        onSelectStaff={(s) => setCurrentStaff(s)}
        dbStatus={dbStatus}
        onOpenDbConfig={() => setIsDbModalOpen(true)}
        isMobileView={isMobileView}
        onToggleMobileView={() => setIsMobileView(!isMobileView)}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
        onAdminLogout={() => setIsAdminLoggedIn(false)}
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs Bar */}
        {!isMobileView && (
          <nav className="flex items-center justify-between overflow-x-auto pb-4 mb-6 border-b border-slate-200 text-xs font-bold scrollbar-none">
            {isUserAdminOrDirector ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab(0)}
                  className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 0
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-400" />
                  통합 관리 대시보드
                </button>

                <button
                  onClick={() => setActiveTab(1)}
                  className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 1
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  전체 교사 연차 관리
                </button>

                <button
                  onClick={() => setActiveTab(2)}
                  className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 relative ${
                    activeTab === 2
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4 text-amber-400" />
                  결재 승인 센터
                  {pendingCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab(3)}
                  className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 3
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  월별 보고서 & PDF
                </button>

                <button
                  onClick={() => setActiveTab(4)}
                  className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 4
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <Settings className="w-4 h-4 text-amber-400" />
                  교사 및 정책 행정
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-emerald-200" />
                    교사 전용 대시보드
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({currentStaff.name} 선생님 / {currentStaff.className})
                  </span>
                </div>

                <button
                  onClick={() => setIsAdminLoginModalOpen(true)}
                  className="bg-slate-900 text-amber-300 hover:bg-slate-800 border border-amber-400/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>원장/관리자 로그인</span>
                </button>
              </div>
            )}
          </nav>
        )}

        {/* Dynamic Main View */}
        {isMobileView ? (
          <MobileStaffView
            currentStaff={currentStaff}
            allStaff={allStaff}
            leaveRequests={leaveRequests}
            notifications={notifications}
            policy={policy}
            onSubmitLeaveRequest={handleSubmitLeaveRequest}
          />
        ) : !isUserAdminOrDirector ? (
          <TeacherDashboardView
            currentStaff={currentStaff}
            allStaff={allStaff}
            leaveRequests={leaveRequests}
            notifications={notifications}
            policy={policy}
            onSubmitLeaveRequest={handleSubmitLeaveRequest}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
          />
        ) : (
          <>
            {activeTab === 0 && (
              <DashboardOverview
                currentStaff={currentStaff}
                allStaff={allStaff}
                leaveRequests={leaveRequests}
                policy={policy}
                onNavigateTab={(idx) => setActiveTab(idx)}
                onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
                isAdminLoggedIn={isAdminLoggedIn}
              />
            )}

            {activeTab === 1 && (
              <AnnualLeaveDashboard
                allStaff={allStaff}
                leaveRequests={leaveRequests}
                policy={policy}
                onUpdateStaffAdjustment={handleUpdateStaffAdjustment}
              />
            )}

            {activeTab === 2 && (
              <LeaveApprovalCenter
                leaveRequests={leaveRequests}
                onApprove={handleApproveLeave}
                onReject={handleRejectLeave}
                currentStaffName={currentStaff.name}
              />
            )}

            {activeTab === 3 && (
              <MonthlyPdfReport
                allStaff={allStaff}
                leaveRequests={leaveRequests}
                policy={policy}
              />
            )}

            {activeTab === 4 && (
              <PolicyAndStaffAdmin
                allStaff={allStaff}
                policy={policy}
                dbStatus={dbStatus}
                onAddStaff={handleAddStaff}
                onUpdateStaff={handleUpdateStaff}
                onDeleteStaff={handleDeleteStaff}
                onUpdatePolicy={handleUpdatePolicy}
                onOpenDbModal={() => setIsDbModalOpen(true)}
                isAdminLoggedIn={isAdminLoggedIn}
                onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
              />
            )}
          </>
        )}
      </div>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={(staff, isAdmin) => {
          if (isAdmin !== undefined) setIsAdminLoggedIn(isAdmin);
          if (staff) {
            setCurrentStaff(staff);
          } else {
            const principal = allStaff.find((s) => s.role === 'admin' || s.positionTitle === '원장') || allStaff[0];
            if (principal) setCurrentStaff(principal);
          }
        }}
      />
    </div>
  );
}
