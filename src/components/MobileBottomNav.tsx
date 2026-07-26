import React from 'react';
import { UserRole } from '../types';
import { Home, FileCheck, Calendar, Users, LayoutDashboard } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentRole: UserRole;
  pendingCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  currentRole,
  pendingCount
}) => {
  const navItems = [
    { id: 'my_leave', label: '내 연차', icon: Home, roles: ['teacher', 'manager', 'director'] },
    { id: 'approval', label: '결재 승인', icon: FileCheck, roles: ['director'], badge: pendingCount },
    { id: 'teachers', label: '교사 관리', icon: Users, roles: ['director'] },
    { id: 'director_dashboard', label: '원장 대시보드', icon: LayoutDashboard, roles: ['director'] },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(currentRole));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E9EDC9] z-40 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl relative transition-all cursor-pointer ${
                isActive ? 'text-[#344E41] font-bold bg-[#F1F3E9]' : 'text-[#718355] hover:text-[#344E41]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#718355]' : 'text-[#718355]'}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-extrabold rounded-full px-1 py-0.2 min-w-[14px] text-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
