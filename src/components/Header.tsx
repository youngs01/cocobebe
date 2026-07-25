import React, { useState } from 'react';
import {
  Baby,
  UserCheck,
  Bell,
  Smartphone,
  Database,
  ChevronDown,
  ShieldCheck,
  Lock,
  LogOut,
} from 'lucide-react';
import { Staff, DbStatus, Notification } from '../types';

interface HeaderProps {
  currentStaff: Staff;
  allStaff: Staff[];
  onSelectStaff: (staff: Staff) => void;
  dbStatus: DbStatus;
  onOpenDbConfig: () => void;
  isMobileView: boolean;
  onToggleMobileView: () => void;
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
  isAdminLoggedIn: boolean;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStaff,
  allStaff,
  onSelectStaff,
  dbStatus,
  onOpenDbConfig,
  isMobileView,
  onToggleMobileView,
  notifications,
  onMarkNotificationRead,
  isAdminLoggedIn,
  onOpenAdminLogin,
  onAdminLogout,
}) => {
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);

  const myNotifications = notifications.filter((n) => n.staffId === currentStaff.id);
  const unreadCount = myNotifications.filter((n) => !n.read).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Nursery Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <Baby className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-lg tracking-tight">
                코코베베 어린이집
              </h1>
              <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-full">
                교직원 연차·휴가 행정 시스템
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              법정 연차 자동 산정 및 직책별 결재 관리 대시보드
            </p>
          </div>
        </div>

        {/* Action Controls & User Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Login Button */}
          {isAdminLoggedIn ? (
            <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline font-mono">cocobebe (원장)</span>
              <button
                onClick={onAdminLogout}
                className="ml-1 text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                title="관리자 로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all cursor-pointer shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>관리자 로그인</span>
            </button>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors relative cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer Popover */}
            {showNotificationDrawer && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                  <h4 className="font-semibold text-xs text-slate-800">
                    실시간 연차 결재 알림
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {myNotifications.length}건
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {myNotifications.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      새로운 알림이 없습니다.
                    </p>
                  ) : (
                    myNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => onMarkNotificationRead(n.id)}
                        className={`p-2.5 rounded-lg text-xs border cursor-pointer transition-colors ${
                          n.read
                            ? 'bg-slate-50 border-slate-100 text-slate-600'
                            : 'bg-amber-50/60 border-amber-200 text-slate-900 font-medium'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-amber-800">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {n.createdAt}
                          </span>
                        </div>
                        <p className="text-xs">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current Staff Switcher (Staff Dashboard Switcher) */}
          <div className="relative">
            <button
              onClick={() => setShowStaffDropdown(!showStaffDropdown)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors text-xs font-medium cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-[11px]">
                {currentStaff.name.slice(0, 1)}
              </div>
              <div className="text-left hidden lg:block">
                <span className="font-bold">{currentStaff.name}</span>
                <span className="text-slate-500 text-[10px] block">
                  {currentStaff.positionTitle} ({currentStaff.className})
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showStaffDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  교직원 대시보드 계정 전환
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {allStaff.length === 0 ? (
                    <div className="p-3 text-center text-slate-500 text-xs">
                      등록된 교직원이 없습니다.<br />
                      <span className="text-[11px] text-amber-700 font-medium">
                        [사용자 및 정책 행정] 탭에서 신규 등록하세요.
                      </span>
                    </div>
                  ) : (
                    allStaff.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          onSelectStaff(s);
                          setShowStaffDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-amber-50 transition-colors cursor-pointer ${
                          s.id === currentStaff.id ? 'bg-amber-50/80 font-bold text-amber-900' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-slate-900">{s.name}</span>{' '}
                          <span className="text-slate-500 text-[11px]">
                            ({s.positionTitle})
                          </span>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {s.className}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
