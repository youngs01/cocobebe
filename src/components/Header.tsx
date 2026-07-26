import React from 'react';
import { User } from '../types';
import { ShieldCheck, Calendar, Database, Sparkles, Building2, LogOut } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onOpenLaborLawModal: () => void;
  dbConnected: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenLaborLawModal,
  dbConnected,
  onLogout
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'director':
        return { label: '원장', bg: 'bg-[#E9EDC9]', text: 'text-[#344E41]', border: 'border-[#A3B18A]' };
      case 'manager':
        return { label: '관리자', bg: 'bg-[#E9EDC9]', text: 'text-[#344E41]', border: 'border-[#A3B18A]' };
      default:
        return { label: '교사', bg: 'bg-[#F1F3E9]', text: 'text-[#718355]', border: 'border-[#E9EDC9]' };
    }
  };

  const badge = getRoleBadge(currentUser.role);

  return (
    <header className="bg-white border-b border-[#E9EDC9] shadow-xs sticky top-0 z-30">
      {/* Top Banner: Daycare Title & User Logout */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          
          {/* Daycare Branding */}
          <div className="flex items-center gap-2 sm:gap-3 text-left">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#718355] flex items-center justify-center text-white shadow-md shadow-[#718355]/20 shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-bold text-[#344E41] tracking-tight truncate">
                  코코베베
                </h1>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-[#E9EDC9] text-[#344E41] border border-[#A3B18A]/40 shrink-0">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 연차
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-[#718355] flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5">
                <span className="truncate">근로기준법</span>
                <span className={`inline-flex items-center gap-0.5 text-[9px] sm:text-[11px] font-medium ${dbConnected ? 'text-[#718355]' : 'text-amber-700'}`}>
                  <Database className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {dbConnected ? 'DB연동' : '로컬'}
                </span>
              </p>
            </div>
          </div>

          {/* Current Logged-in User Info & Logout Button */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 bg-[#F1F3E9] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-[#E9EDC9]">
            <div className="flex items-center gap-1.5 sm:gap-2 pl-0.5 sm:pl-1 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#718355] text-white flex items-center justify-center font-bold text-xs sm:text-xs shadow-xs shrink-0">
                {currentUser.name ? currentUser.name.slice(0, 1) : '교'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#344E41] truncate">{currentUser.name}</span>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${badge.bg} ${badge.text} ${badge.border} shrink-0`}>
                    {currentUser.position || badge.label}
                  </span>
                </div>
                <p className="text-[10px] text-[#718355] font-medium truncate">담당: {currentUser.department}</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="px-2 sm:px-2.5 py-1.5 sm:py-1.5 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200 text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all shadow-2xs flex items-center gap-0.5 sm:gap-1 cursor-pointer shrink-0"
              title="로그아웃"
            >
              <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>

        {/* Bottom Sub-bar: Public Holiday Status & Legal Info Link */}
        <div className="mt-1.5 sm:mt-2.5 pt-1.5 sm:pt-2 border-t border-[#E9EDC9]/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-[10px] sm:text-xs">
          
          {/* Public & Substitute Holiday Display Indicator */}
          <div className="flex items-center gap-1 text-[#344E41] text-left">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#718355] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#718355]"></span>
            </span>
            <span className="font-bold text-[#344E41] bg-[#F1F3E9] px-2 py-0.5 rounded-lg border border-[#E9EDC9] flex items-center gap-1 text-[11px] sm:text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#718355]" />
              관공서 공휴일 & 대체공휴일 달력 자동 반영
            </span>
            <span className="text-[11px] text-[#718355] hidden md:inline">
              (주말/공휴일 소정근로시간 자동제외)
            </span>
          </div>

          {/* Labor Law Guide Link */}
          <button
            onClick={onOpenLaborLawModal}
            className="text-[#344E41] hover:text-[#718355] bg-[#F1F3E9] hover:bg-[#E9EDC9] px-2.5 py-1 rounded-lg border border-[#E9EDC9] font-semibold text-left sm:text-center flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] sm:text-xs w-full sm:w-auto justify-center"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#718355] shrink-0" />
            근로기준법 제60조 법정연차 생성 기준
          </button>
        </div>
      </div>
    </header>
  );
};

