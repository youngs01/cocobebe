import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  LogOut, 
  UserPlus,
  ClipboardList,
  PieChart as PieChartIcon,
  ChevronRight,
  Clock,
  Settings,
  FileText,
  Printer,
  Download,
  Bell,
  BellOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { Teacher, LeaveRequest, Notification } from './types';
import { calculateAnnualLeave, getLeaveUsage } from './utils/leaveCalculator';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
// html2pdf is dynamically imported where needed to avoid duplicate/static+dynamic import issues

const API_BASE = import.meta.env.VITE_API_URL || '';
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API_BASE}${path}`, opts);

const DocumentModal = ({ request, onClose, teachers }: { request: LeaveRequest; onClose: () => void; teachers: Teacher[] }) => {
  const [generating, setGenerating] = useState(false);
  const teacher = teachers.find(t => t.id === request.teacher_id);
  const roleDisplay = (role?: string) => {
    switch(role) {
      case 'director': return '원장';
      case 'admin': return '관리자';
      case 'assistant': return '보조교사';
      case 'cook': return '조리사';
      case 'extension': return '연장반교사';
      case 'night_extension': return '야간반 연장교사';
      default: return '교사';
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('printable-document');
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `연차신청서_${request.teacher_name}_${request.start_date}.pdf`,
      image: { type: 'png' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' }
    };

    setGenerating(true);
    try {
      const { default: html2pdf } = await import('html2pdf.js');

      // give browser a tick to render overlay/etc
      await new Promise(r => setTimeout(r, 0));
      await html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error('PDF 생성 실패', e);
      alert('PDF 저장 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-overlay-bg">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden no-print-container"
      >
        <div className="p-6 border-b border-brand-100 flex justify-between items-center bg-brand-50 no-print">
          <h3 className="text-xl font-bold text-brand-900 flex items-center gap-2">
            <FileText className="text-brand-600" />
            전자 결재 문서
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={downloadPDF}
              disabled={generating}
              className="p-2 text-brand-500 hover:bg-brand-100 rounded-lg transition-colors disabled:opacity-50"
              title="PDF 다운로드"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={onClose}
              disabled={generating}
              className="p-2 text-brand-400 hover:bg-brand-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle size={24} />
            </button>
          </div>
        </div>
        
        <div className="relative p-12 bg-white print:p-0" id="printable-document">
          {generating && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent"></div>
            </div>
          )}
          <div className="border-4 border-double border-brand-900 p-8 relative">
            <div className="flex justify-between items-start mb-12 gap-4">
              <div className="w-32 hidden md:block"></div>
              <h1 className="text-4xl font-serif font-bold text-center tracking-[1rem] underline underline-offset-8 whitespace-nowrap pt-4">
                연 차 신 청 서
              </h1>
              <div className="w-32 flex justify-end">
                <div className="border-2 border-brand-900 flex shrink-0">
                  <div className="border-r-2 border-brand-900 p-2 text-xs font-bold flex items-center justify-center w-8 [writing-mode:vertical-rl]">
                    결재
                  </div>
                  <div className="w-24 h-24 flex flex-col items-center justify-start pt-2 relative">
                    <span className="text-[10px] text-brand-400 font-bold mb-1">원장</span>
                    <div className="w-full h-[1px] bg-brand-900 mb-1"></div>
                    {request.status === 'approved' && (
                      <div className="w-14 h-14 border-4 border-red-500 rounded-full flex items-center justify-center relative rotate-12 mt-1">
                        <span className="text-red-500 font-bold text-[10px] leading-tight text-center">
                          {request.processed_by}<br/>인
                        </span>
                        <div className="absolute inset-0 border-2 border-red-500 rounded-full scale-90 opacity-50"></div>
                      </div>
                    )}
                    {request.status === 'rejected' && (
                      <div className="w-14 h-14 border-4 border-gray-400 rounded-full flex items-center justify-center relative -rotate-12 mt-1">
                        <span className="text-gray-400 font-bold text-xs">반려</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <table className="w-full border-collapse border border-brand-900 mb-8">
              <tbody>
                <tr>
                  <th className="border border-brand-900 bg-brand-50 p-3 w-32 text-sm">성 명</th>
                  <td className="border border-brand-900 p-3 text-center font-bold">{request.teacher_name}</td>
                  <th className="border border-brand-900 bg-brand-50 p-3 w-32 text-sm">직 책</th>
                  <td className="border border-brand-900 p-3 text-center">{roleDisplay(teacher?.role)}</td>
                </tr>
                <tr>
                  <th className="border border-brand-900 bg-brand-50 p-3 text-sm">기 간</th>
                  <td colSpan={3} className="border border-brand-900 p-3 text-center font-bold">
                    {request.start_date} ~ {request.end_date}
                    <span className="ml-2 text-xs text-brand-500">
                      ({request.type === 'full' ? '연차' : request.type === 'half_am' ? '반차(오전)' : '반차(오후)'})
                    </span>
                  </td>
                </tr>
                <tr>
                  <th className="border border-brand-900 bg-brand-50 p-3 text-sm">사 유</th>
                  <td colSpan={3} className="border border-brand-900 p-3 min-h-[100px] align-top">
                    {request.reason}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="text-center space-y-4 my-12">
              <p className="text-lg">위와 같이 연차 휴가를 신청하오니 승인하여 주시기 바랍니다.</p>
              <p className="text-xl font-bold mt-8">{format(new Date(), 'yyyy년 MM월 dd일')}</p>
              <p className="text-2xl font-bold mt-8">신청인: {request.teacher_name} (인)</p>
            </div>

            <div className="mt-12 pt-8 border-t border-brand-200 text-center">
              <h2 className="text-3xl font-bold tracking-widest">코코베베 어린이집</h2>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-brand-50 border-t border-brand-100 flex justify-end no-print">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-brand-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<Teacher | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);
  const [loginForm, setLoginForm] = useState({ name: '', password: '' });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'teachers' | 'requests' | 'my-leave' | 'profile'>('dashboard');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmDeleteRequestId, setConfirmDeleteRequestId] = useState<number | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<LeaveRequest | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [editingLeaveTeacherId, setEditingLeaveTeacherId] = useState<number | null>(null);
  const [leaveAdjustmentValue, setLeaveAdjustmentValue] = useState<number>(0);

  // Form states
  const [newTeacher, setNewTeacher] = useState({ 
    name: '', 
    join_date: '', 
    role: 'teacher' as Teacher['role'], 
    password: '', 
    class_name: '' 
  });
  const [newRequest, setNewRequest] = useState({ type: 'full' as const, start_date: '', end_date: '', reason: '' });
  const [profileForm, setProfileForm] = useState({ password: '', class_name: '' });

  useEffect(() => {
    if (user) {
      setProfileForm({ password: user.password || '', class_name: user.class_name || '' });
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tRes, rRes] = await Promise.all([
        apiFetch('/api/teachers'),
        apiFetch('/api/leave-requests')
      ]);
      
      if (!tRes.ok || !rRes.ok) {
        throw new Error(`Server error: ${tRes.status} / ${rRes.status}`);
      }

      const tContentType = tRes.headers.get("content-type");
      const rContentType = rRes.headers.get("content-type");

      if (!tContentType?.includes("application/json") || !rContentType?.includes("application/json")) {
        throw new Error("Server returned non-JSON response. The server might be crashing or restarting.");
      }

      const tData = await tRes.json();
      const rData = await rRes.json();
      setTeachers(tData);
      setRequests(rData);

      let nData: Notification[] = [];
      if (user) {
        const nRes = await apiFetch(`/api/notifications/${user.id}`);
        if (nRes.ok) {
          nData = await nRes.json();
          setNotifications(nData);
        }
      }
      return { tData, rData, nData };
    } catch (err) {
      console.error('Failed to fetch data', err);
      return { tData: [], rData: [], nData: [] };
    }
  };

  const markNotificationAsRead = async (id: number) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    fetchData();
  };

  const clearNotifications = async () => {
    if (!user) return;
    await apiFetch(`/api/notifications/${user.id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        const found: Teacher = data.user;
        setUser(found);
        setIsLoginModalOpen(false);
        setActiveTab(found.role === 'admin' ? 'dashboard' : 'my-leave');

        // refresh data (including notifications for this user)
        const { rData, nData } = await fetchData();

        // director/admin: check for pending leave requests
        if (found.role === 'director' || found.role === 'admin') {
          const pending = rData.filter(r => r.status === 'pending').length;
          if (pending > 0) {
            alert(`승인 대기 중인 연차 요청이 ${pending}건 있습니다.`);
          }
        } else {
          // regular teacher: alert if any unread approval notifications
          const approveIds = nData
            .filter(n => !n.is_read && n.message.includes('승인되'))
            .map(n => n.id);
          if (approveIds.length > 0) {
            alert(`연차 승인 알림이 ${approveIds.length}건 있습니다.`);
            approveIds.forEach(id => markNotificationAsRead(id));
          }
        }
      } else {
        alert('이름 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Role': user?.role || '' },
      body: JSON.stringify(newTeacher)
    });
    if (res.ok) {
      fetchData();
      setNewTeacher({ name: '', join_date: '', role: 'teacher', password: '', class_name: '' });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const res = await apiFetch(`/api/teachers/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileForm)
    });
    if (res.ok) {
      alert('프로필이 수정되었습니다. 다시 로그인해주세요.');
      setUser(null);
      setIsLoginModalOpen(true);
      fetchData();
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    try {
      const res = await apiFetch(`/api/teachers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        setConfirmDeleteId(null);
      } else {
        const data = await res.json();
        alert(`삭제 실패: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (err) {
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  const handleResetPassword = async (id: number) => {
    try {
      const res = await apiFetch(`/api/teachers/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '1234' })
      });
      if (res.ok) {
        alert('비밀번호가 초기화되었습니다. 기본값은 1234입니다.');
      } else {
        const data = await res.json();
        alert(`초기화 실패: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (err) {
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const res = await apiFetch('/api/leave-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newRequest, teacher_id: user.id })
    });
    if (res.ok) {
      fetchData();
      setNewRequest({ type: 'full', start_date: '', end_date: '', reason: '' });
      alert('연차 신청이 완료되었습니다.');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    if (!user) return;
    await apiFetch(`/api/leave-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, processed_by: user.name })
    });
    fetchData();
  };

  const handleDeleteRequest = async (id: number) => {
    try {
      const res = await apiFetch(`/api/leave-requests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        setConfirmDeleteRequestId(null);
      } else {
        const data = await res.json();
        alert(`취소 실패: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (err) {
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateLeaveAdjustment = async (teacherId: number) => {
    try {
      const res = await apiFetch(`/api/teachers/${teacherId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leave_adjustment: leaveAdjustmentValue })
      });
      if (res.ok) {
        alert('연차가 수정되었습니다.');
        fetchData();
        setEditingLeaveTeacherId(null);
        setLeaveAdjustmentValue(0);
      } else {
        alert('수정 실패');
      }
    } catch (err) {
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  const downloadDashboardPDF = async () => {
    const element = document.querySelector('main');
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `연차현황_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
      image: { type: 'png' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'landscape' as const, unit: 'mm' as const, format: 'a4' }
    };

    try {
      const { default: html2pdf } = await import('html2pdf.js');
      // allow UI to settle
      await new Promise(r => setTimeout(r, 0));
      await html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error('PDF 생성 실패', e);
      alert('PDF 저장 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
    }
  };
  const chartData = teachers.filter(t => t.role !== 'admin').map(t => {
    const total = calculateAnnualLeave(t.join_date);
    const used = getLeaveUsage(requests.filter(r => r.teacher_id === t.id));
    const adjustment = t.leave_adjustment || 0;
    return {
      name: t.name,
      total,
      used,
      adjustment,
      remaining: Math.max(0, total - used + adjustment)
    };
  });

  if (isLoginModalOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-100 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-brand-200"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Calendar className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-brand-900">코코베베 어린이집</h1>
            <p className="text-brand-500">연차 관리 시스템</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">이름</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                placeholder="성함을 입력하세요"
                value={loginForm.name}
                onChange={e => setLoginForm({...loginForm, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">비밀번호</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                placeholder="비밀번호를 입력하세요"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-brand-500 text-white py-3 rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-md mt-4"
            >
              로그인
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-brand-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-brand-200 flex flex-col no-print hidden lg:flex">
        <div className="p-6 border-bottom border-brand-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-md">
                <Calendar className="text-white w-5 h-5" />
              </div>
              <div>
                {user?.class_name && (
                  <p className="text-[10px] font-bold text-brand-500 leading-none mb-0.5">{user.class_name}</p>
                )}
                <span className="font-bold text-lg text-brand-900 leading-none">코코베베</span>
              </div>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 text-brand-400 hover:bg-brand-50 rounded-lg transition-colors relative"
              >
                {notifications.some(n => !n.is_read) ? (
                  <Bell className="text-brand-600" size={20} />
                ) : (
                  <BellOff size={20} />
                )}
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-brand-100 z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-brand-50 flex justify-between items-center bg-brand-50">
                      <span className="text-xs font-bold text-brand-900">알림</span>
                      <button 
                        onClick={clearNotifications}
                        className="text-[10px] text-brand-400 hover:text-brand-600"
                      >
                        모두 삭제
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-brand-400">새로운 알림이 없습니다.</div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => markNotificationAsRead(n.id)}
                            className={`p-3 border-b border-brand-50 cursor-pointer hover:bg-brand-50 transition-colors ${n.is_read ? 'opacity-50' : 'bg-white'}`}
                          >
                            <p className="text-xs text-brand-900 leading-tight mb-1">{n.message}</p>
                            <p className="text-[10px] text-brand-400">{format(parseISO(n.created_at), 'MM/dd HH:mm')}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="bg-brand-100 p-4 rounded-2xl">
            {user?.class_name && (
              <p className="text-xs font-bold text-brand-600 mb-0.5">{user.class_name}</p>
            )}
            <p className="text-[10px] text-brand-500 mb-1">
              {user?.role === 'admin' ? '마스터 관리자' : 
               user?.role === 'director' ? '원장' : 
               user?.role === 'assistant' ? '보조교사' :
               user?.role === 'cook' ? '조리사' :
               user?.role === 'extension' ? '연장반교사' : user?.role === 'night_extension' ? '야간반 연장교사' : '교사'}
            </p>
            <p className="font-bold text-brand-900">{user?.name} 님</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {(user?.role === 'admin' || user?.role === 'director') && (
            <SidebarItem 
              icon={<PieChartIcon size={20} />} 
              label="대시보드" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
          )}
          {user?.role === 'admin' && (
            <SidebarItem 
              icon={<Users size={20} />} 
              label="교직원 관리" 
              active={activeTab === 'teachers'} 
              onClick={() => setActiveTab('teachers')} 
            />
          )}
          {(user?.role === 'admin' || user?.role === 'director') && (
            <SidebarItem 
              icon={<ClipboardList size={20} />} 
              label="연차 승인" 
              active={activeTab === 'requests'} 
              onClick={() => setActiveTab('requests')} 
            />
          )}
          {user?.role !== 'admin' && (
            <SidebarItem 
              icon={<Calendar size={20} />} 
              label="내 연차 현황" 
              active={activeTab === 'my-leave'} 
              onClick={() => setActiveTab('my-leave')} 
            />
          )}
          <SidebarItem 
            icon={<Settings size={20} />} 
            label="내 정보 수정" 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
          />
        </nav>

        <div className="p-4 border-t border-brand-100">
          <button 
            onClick={() => { setUser(null); setIsLoginModalOpen(true); }}
            className="flex items-center gap-3 w-full px-4 py-3 text-brand-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      {/* mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-200 lg:hidden">
        <div className="flex justify-around py-1">
          <MobileNavItem
            icon={<Users className="w-5 h-5" />}
            label="교직원"
            active={activeTab === 'teachers'}
            onClick={() => setActiveTab('teachers')}
          />
          <MobileNavItem
            icon={<ClipboardList className="w-5 h-5" />}
            label="요청"
            active={activeTab === 'requests'}
            onClick={() => setActiveTab('requests')}
          />
          <MobileNavItem
            icon={<PieChartIcon className="w-5 h-5" />}
            label="대시보드"
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <MobileNavItem
            icon={<Settings className="w-5 h-5" />}
            label="내정보"
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          />
          <button
            onClick={() => { setUser(null); setIsLoginModalOpen(true); }}
            className="flex flex-col items-center justify-center text-xs py-1 w-16 text-brand-500"
          >
            <LogOut className="w-5 h-5" />
            <span className="mt-1">로그아웃</span>
          </button>
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto p-8 print:p-0 pb-40 lg:pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="flex justify-between items-end">
                <div>
                  {user?.class_name && (
                    <p className="text-xs font-bold text-brand-500 mb-1">{user.class_name}</p>
                  )}
                  <h2 className="text-3xl font-bold text-brand-900">대시보드</h2>
                  <p className="text-brand-500">전체 교직원 연차 사용 현황입니다.</p>
                </div>
                {(user?.role === 'admin' || user?.role === 'director') && (
                  <button 
                    onClick={downloadDashboardPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-200 rounded-xl text-brand-600 font-bold hover:bg-brand-50 transition-colors shadow-sm"
                  >
                    <Download size={18} />
                    현황 PDF 다운로드
                  </button>
                )}
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <StatCard 
                  title="전체 교직원" 
                  value={teachers.length.toString()} 
                  icon={<Users className="text-blue-500" />} 
                />
                <StatCard 
                  title="대기 중인 승인" 
                  value={requests.filter(r => r.status === 'pending').length.toString()} 
                  icon={<Clock className="text-orange-500" />} 
                />
                <StatCard 
                  title="이번 달 사용 연차" 
                  value={requests.filter(r => r.status === 'approved' && r.start_date.startsWith(format(new Date(), 'yyyy-MM'))).length.toString()} 
                  icon={<CheckCircle className="text-green-500" />} 
                />
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-200">
                <h3 className="text-xl font-bold mb-6 text-brand-900">교사별 연차 현황</h3>
                {/* desktop chart */}
                <div className="hidden lg:block h-80 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320} debounce={100}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="used" name="사용" fill="#b88e6f" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="remaining" name="잔여" fill="#e6d5c5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* mobile list */}
                <div className="lg:hidden space-y-3">
                  {chartData.map(t => (
                    <div key={t.name} className="flex items-center">
                      <span className="text-sm w-20 truncate">{t.name}</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full mx-2 overflow-hidden">
                        <div
                          className="h-full bg-brand-500"
                          style={{ width: `${t.total ? (t.remaining / t.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs w-12 text-right">{t.remaining}일</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'teachers' && (
            <motion.div 
              key="teachers"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="flex justify-between items-end">
                <div>
                  {user?.class_name && (
                    <p className="text-xs font-bold text-brand-500 mb-1">{user.class_name}</p>
                  )}
                  <h2 className="text-3xl font-bold text-brand-900">교직원 관리</h2>
                  <p className="text-brand-500">교직원을 추가하거나 삭제할 수 있습니다.</p>
                </div>
              </header>

              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-1">
                  {user?.role === 'admin' && (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-brand-200 sticky top-8">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <UserPlus size={20} className="text-brand-500" />
                        신규 교사 등록
                      </h3>
                      <form onSubmit={handleAddTeacher} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-1">이름</label>
                          <input 
                            type="text" 
                            required
                            className="w-full px-4 py-2 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={newTeacher.name}
                            onChange={e => setNewTeacher({...newTeacher, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-1">입사일</label>
                          <input 
                            type="date" 
                            required
                            className="w-full px-4 py-2 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={newTeacher.join_date}
                            onChange={e => setNewTeacher({...newTeacher, join_date: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-1">담당 반</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-2 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={newTeacher.class_name}
                            onChange={e => setNewTeacher({...newTeacher, class_name: e.target.value})}
                            placeholder="예: 햇살반"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-1">직책</label>
                          <select 
                            className="w-full px-4 py-2 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={newTeacher.role}
                            onChange={e => setNewTeacher({...newTeacher, role: e.target.value as any})}
                          >
                            <option value="teacher">교사</option>
                            <option value="director">원장</option>
                            <option value="assistant">보조교사</option>
                            <option value="cook">조리사</option>
                            <option value="extension">연장반교사</option>
                            <option value="night_extension">야간반 연장교사</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-1">비밀번호</label>
                          <input 
                            type="text" 
                            required
                            className="w-full px-4 py-2 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={newTeacher.password}
                            onChange={e => setNewTeacher({...newTeacher, password: e.target.value})}
                            placeholder="초기 비밀번호"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-brand-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors shadow-md"
                        >
                          등록하기
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                <div className="xl:col-span-3">
                  <div className="bg-white rounded-3xl shadow-sm border border-brand-200 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-brand-100">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">이름</th>
                          <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">직책</th>
                          <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">반</th>
                          <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">입사일</th>
                          <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">총 연차</th>
                          <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">사용</th>
                          <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">조정</th>
                          <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">잔여</th>
                          <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider text-right">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-100">
                        {teachers.filter(t => t.role !== 'admin').map(t => {
                          const total = calculateAnnualLeave(t.join_date);
                          const used = getLeaveUsage(requests.filter(r => r.teacher_id === t.id));
                          const adjustment = t.leave_adjustment || 0;
                          return (
                            <tr key={t.id} className="hover:bg-brand-50 transition-colors">
                              <td className="px-6 py-4 font-bold text-brand-900">{t.name}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                                  t.role === 'director' ? 'bg-purple-100 text-purple-700' : 
                                  t.role === 'assistant' ? 'bg-blue-100 text-blue-700' :
                                  t.role === 'cook' ? 'bg-orange-100 text-orange-700' :
                                  t.role === 'extension' ? 'bg-green-100 text-green-700' : t.role === 'night_extension' ? 'bg-purple-100 text-purple-700' : 'bg-brand-100 text-brand-700'
                                }`}>
                                  {t.role === 'director' ? '원장' : 
                                   t.role === 'assistant' ? '보조교사' :
                                   t.role === 'cook' ? '조리사' :
                                   t.role === 'extension' ? '연장반교사' : t.role === 'night_extension' ? '야간반 연장교사' : '교사'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-brand-500">{t.class_name || '-'}</td>
                              <td className="px-6 py-4 text-brand-500">{t.join_date}</td>
                              <td className="px-6 py-4 font-medium">{total}일</td>
                              <td className="px-6 py-4 text-brand-500">{used}일</td>
                              <td className="px-6 py-4 text-brand-500">{t.leave_adjustment || 0}일</td>
                              <td className="px-6 py-4 font-bold text-brand-700">{Math.max(0, total - used + (t.leave_adjustment||0))}일</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  {editingLeaveTeacherId === t.id ? (
                                    <>
                                      <input 
                                        type="number" 
                                        className="w-16 px-2 py-1 border border-brand-200 rounded-lg text-xs"
                                        value={leaveAdjustmentValue}
                                        onChange={e => setLeaveAdjustmentValue(parseInt(e.target.value) || 0)}
                                        placeholder="수정값"
                                      />
                                      <button 
                                        onClick={() => handleUpdateLeaveAdjustment(t.id)}
                                        className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded-lg hover:bg-green-600 transition-colors"
                                      >
                                        저장
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setEditingLeaveTeacherId(null);
                                          setLeaveAdjustmentValue(0);
                                        }}
                                        className="px-2 py-1 bg-brand-100 text-brand-500 text-[10px] font-bold rounded-lg hover:bg-brand-200 transition-colors"
                                      >
                                        취소
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button 
                                        onClick={() => {
                                          setEditingLeaveTeacherId(t.id);
                                          setLeaveAdjustmentValue(t.leave_adjustment || 0);
                                        }}
                                        className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg hover:bg-blue-100 transition-colors"
                                        title="연차 수정"
                                      >
                                        수정
                                      </button>
                                      {confirmDeleteId === t.id ? (
                                        <>
                                          <button 
                                            onClick={() => handleDeleteTeacher(t.id)}
                                            className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
                                          >
                                            삭제확인
                                          </button>
                                          <button 
                                            onClick={() => setConfirmDeleteId(null)}
                                            className="px-3 py-1 bg-brand-100 text-brand-500 text-xs font-bold rounded-lg hover:bg-brand-200 transition-colors"
                                          >
                                            취소
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          {user?.role === 'admin' && (
                                            <button 
                                              onClick={() => handleResetPassword(t.id)}
                                              className="p-2 text-yellow-500 hover:text-yellow-700 transition-colors"
                                              title="비밀번호 초기화"
                                            >
                                              🔑
                                            </button>
                                          )}
                                          <button 
                                            onClick={() => setConfirmDeleteId(t.id)}
                                            className="p-2 text-brand-400 hover:text-red-500 transition-colors"
                                          >
                                            <Trash2 size={18} />
                                          </button>
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div 
              key="requests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header>
                {user?.class_name && (
                  <p className="text-xs font-bold text-brand-500 mb-1">{user.class_name}</p>
                )}
                <h2 className="text-3xl font-bold text-brand-900">연차 승인 관리</h2>
                <p className="text-brand-500">교사들이 신청한 연차를 검토하고 승인합니다.</p>
              </header>

              <div>
                {/* Desktop table view */}
                <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-brand-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-brand-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">신청자</th>
                        <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">구분</th>
                        <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">기간</th>
                        <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">사유</th>
                        <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">상태</th>
                        <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider text-right">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-100">
                      {requests.map(r => (
                      <tr key={r.id} className="hover:bg-brand-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-brand-900">{r.teacher_name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            r.type === 'full' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {r.type === 'full' ? '연차' : r.type === 'half_am' ? '반차(오전)' : '반차(오후)'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-brand-500">
                          {r.start_date} {r.type === 'full' && r.start_date !== r.end_date ? `~ ${r.end_date}` : ''}
                        </td>
                        <td className="px-6 py-4 text-brand-500 max-w-xs truncate">{r.reason}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {confirmDeleteRequestId === r.id ? (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleDeleteRequest(r.id)}
                                className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
                              >
                                삭제확인
                              </button>
                              <button 
                                onClick={() => setConfirmDeleteRequestId(null)}
                                className="px-3 py-1 bg-brand-100 text-brand-500 text-xs font-bold rounded-lg hover:bg-brand-200 transition-colors"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            r.status === 'pending' ? (
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleUpdateStatus(r.id, 'approved')}
                                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                  title="승인"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button 
                                  onClick={() => handleUpdateStatus(r.id, 'rejected')}
                                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                  title="반려"
                                >
                                  <XCircle size={18} />
                                </button>
                                {user?.role === 'admin' && (
                                  <button 
                                    onClick={() => setConfirmDeleteRequestId(r.id)}
                                    className="p-2 bg-brand-50 text-brand-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                                    title="삭제"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                                {r.status === 'approved' && (
                                  <button 
                                    onClick={() => setSelectedDocument(r)}
                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                    title="문서 보기"
                                  >
                                    <FileText size={18} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleUpdateStatus(r.id, 'pending')}
                                  className="px-3 py-1 bg-brand-100 text-brand-600 text-xs font-bold rounded-lg hover:bg-brand-200 transition-colors"
                                >
                                  승인취소
                                </button>
                                {user?.role === 'admin' && (
                                  <button 
                                    onClick={() => setConfirmDeleteRequestId(r.id)}
                                    className="p-2 bg-brand-50 text-brand-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                                    title="삭제"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                                {r.status === 'approved' && (
                                  <button 
                                    onClick={() => setSelectedDocument(r)}
                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                    title="문서 보기"
                                  >
                                    <FileText size={18} />
                                  </button>
                                )}
                              </div>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* end desktop/table wrapper */}
              </div>
            </motion.div>
          )}

          {activeTab === 'my-leave' && user && (
            <motion.div 
              key="my-leave"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header>
                {user?.class_name && (
                  <p className="text-xs font-bold text-brand-500 mb-1">{user.class_name}</p>
                )}
                <h2 className="text-3xl font-bold text-brand-900">내 연차 현황</h2>
                <p className="text-brand-500">나의 연차 발생 및 사용 내역입니다.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-200 text-center">
                    <p className="text-sm text-brand-500 mb-2">잔여 연차</p>
                    <p className="text-5xl font-bold text-brand-900 mb-4">
                      {Math.max(0, calculateAnnualLeave(user.join_date) - getLeaveUsage(requests.filter(r => r.teacher_id === user.id)) + (user.leave_adjustment || 0))}
                      <span className="text-xl ml-1">일</span>
                    </p>
                    <div className="flex justify-between text-sm pt-4 border-t border-brand-100">
                      <div>
                        <p className="text-brand-400">총 발생</p>
                        <p className="font-bold">{calculateAnnualLeave(user.join_date)}일</p>
                      </div>
                      <div>
                        <p className="text-brand-400">사용</p>
                        <p className="font-bold">{getLeaveUsage(requests.filter(r => r.teacher_id === user.id))}일</p>
                      </div>
                      <div>
                        <p className="text-brand-400">조정</p>
                        <p className="font-bold">{user.leave_adjustment || 0}일</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-900 p-8 rounded-3xl shadow-lg text-white">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Plus size={20} />
                      연차 신청
                    </h3>
                    <form onSubmit={handleRequestLeave} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-brand-300 uppercase tracking-wider mb-1">구분</label>
                        <select 
                          className="w-full bg-brand-800 border-none rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-brand-400"
                          value={newRequest.type}
                          onChange={e => setNewRequest({...newRequest, type: e.target.value as any})}
                        >
                          <option value="full">연차(종일)</option>
                          <option value="half_am">반차(오전)</option>
                          <option value="half_pm">반차(오후)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-brand-300 uppercase tracking-wider mb-1">시작일</label>
                        <input 
                          type="date" 
                          required
                          className="w-full bg-brand-800 border-none rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-brand-400"
                          value={newRequest.start_date}
                          onChange={e => setNewRequest({...newRequest, start_date: e.target.value})}
                        />
                      </div>
                      {newRequest.type === 'full' && (
                        <div>
                          <label className="block text-xs font-bold text-brand-300 uppercase tracking-wider mb-1">종료일</label>
                          <input 
                            type="date" 
                            required
                            className="w-full bg-brand-800 border-none rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-brand-400"
                            value={newRequest.end_date}
                            onChange={e => setNewRequest({...newRequest, end_date: e.target.value})}
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-brand-300 uppercase tracking-wider mb-1">사유</label>
                        <textarea 
                          className="w-full bg-brand-800 border-none rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-brand-400 h-20 resize-none"
                          placeholder="사유를 입력하세요"
                          value={newRequest.reason}
                          onChange={e => setNewRequest({...newRequest, reason: e.target.value})}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-white text-brand-900 py-3 rounded-xl font-bold hover:bg-brand-100 transition-colors shadow-md"
                      >
                        신청하기
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <div className="bg-white rounded-3xl shadow-sm border border-brand-200 overflow-hidden">
                    <div className="p-6 border-b border-brand-100">
                      <h3 className="text-lg font-bold text-brand-900">신청 내역</h3>
                    </div>
                    <table className="w-full text-left">
                      <thead className="bg-brand-50">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">구분</th>
                          <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">기간</th>
                          <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">사유</th>
                          <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider">상태</th>
                          <th className="px-6 py-4 text-xs font-bold text-brand-500 uppercase tracking-wider text-right">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-100">
                        {requests.filter(r => r.teacher_id === user.id).map(r => (
                          <tr key={r.id} className="hover:bg-brand-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                r.type === 'full' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {r.type === 'full' ? '연차' : r.type === 'half_am' ? '반차(오전)' : '반차(오후)'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-brand-500">
                              {r.start_date} {r.type === 'full' && r.start_date !== r.end_date ? `~ ${r.end_date}` : ''}
                            </td>
                            <td className="px-6 py-4 text-brand-500">{r.reason}</td>
                            <td className="px-6 py-4">
                              <StatusBadge status={r.status} />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {r.status !== 'approved' && (
                                  confirmDeleteRequestId === r.id ? (
                                    <div className="flex justify-end gap-2">
                                      <button 
                                        onClick={() => handleDeleteRequest(r.id)}
                                        className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition-colors"
                                      >
                                        확인
                                      </button>
                                      <button 
                                        onClick={() => setConfirmDeleteRequestId(null)}
                                        className="px-2 py-1 bg-brand-100 text-brand-500 text-[10px] font-bold rounded-lg hover:bg-brand-200 transition-colors"
                                      >
                                        취소
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => setConfirmDeleteRequestId(r.id)}
                                      className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1 ml-auto"
                                      title="신청 취소"
                                    >
                                      <Trash2 size={14} />
                                      취소
                                    </button>
                                  )
                                )}
                                {r.status === 'approved' && (
                                  <button 
                                    onClick={() => setSelectedDocument(r)}
                                    className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 ml-auto"
                                    title="문서 보기"
                                  >
                                    <FileText size={14} />
                                    문서
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {requests.filter(r => r.teacher_id === user.id).length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-brand-400">
                              신청 내역이 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <header className="mb-8">
                {user?.class_name && (
                  <p className="text-xs font-bold text-brand-500 mb-1">{user.class_name}</p>
                )}
                <h2 className="text-3xl font-bold text-brand-900">내 정보 수정</h2>
                <p className="text-brand-500">비밀번호와 담당 반 정보를 수정할 수 있습니다.</p>
              </header>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-200">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">이름</label>
                      <input 
                        type="text" 
                        disabled
                        className="w-full px-4 py-3 rounded-xl bg-brand-50 border border-brand-200 text-brand-400 cursor-not-allowed"
                        value={user?.name}
                      />
                      <p className="mt-1 text-[10px] text-brand-400">* 이름 수정은 관리자에게 문의하세요.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">입사일</label>
                      <input 
                        type="text" 
                        disabled
                        className="w-full px-4 py-3 rounded-xl bg-brand-50 border border-brand-200 text-brand-400 cursor-not-allowed"
                        value={user?.join_date}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">담당 반</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      value={profileForm.class_name}
                      onChange={e => setProfileForm({...profileForm, class_name: e.target.value})}
                      placeholder="예: 햇살반"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">새 비밀번호</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      value={profileForm.password}
                      onChange={e => setProfileForm({...profileForm, password: e.target.value})}
                      placeholder="변경할 비밀번호를 입력하세요"
                    />
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      className="w-full bg-brand-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Settings size={20} />
                      정보 수정하기
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedDocument && (
          <DocumentModal 
            request={selectedDocument} 
            onClose={() => setSelectedDocument(null)} 
            teachers={teachers}
          />
        )}
        {/* footer showing author/creator */}
        <footer className="text-center py-4 text-sm text-gray-500">
          코코베베 어린이집
        </footer>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-brand-900 text-white shadow-md' 
          : 'text-brand-500 hover:bg-brand-100 hover:text-brand-900'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {active && <ChevronRight size={16} className="ml-auto" />}
    </button>
  );
}

function MobileNavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center text-xs py-1 w-16 ${
        active ? 'text-brand-900' : 'text-brand-500'
      }`}
    >
      {icon}
      <span className="mt-1">{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-brand-200 flex items-center gap-4">
      <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-xl">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-brand-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-brand-900">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-orange-100 text-orange-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700'
  };
  const labels = {
    pending: '대기 중',
    approved: '승인됨',
    rejected: '반려됨'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
}
