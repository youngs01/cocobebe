import React, { useState } from 'react';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  CheckCircle,
  AlertCircle,
  Search,
  UserCheck,
  Building,
} from 'lucide-react';
import { Staff, AttendanceRecord } from '../types';

interface RealtimeAttendanceProps {
  allStaff: Staff[];
  attendance: AttendanceRecord[];
  onCheckIn: (staffId: string, note?: string) => void;
  onCheckOut: (staffId: string) => void;
}

export const RealtimeAttendance: React.FC<RealtimeAttendanceProps> = ({
  allStaff,
  attendance,
  onCheckIn,
  onCheckOut,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAttendance = attendance.filter((a) => a.date === selectedDate);

  const mergedStaffAttendance = allStaff
    .map((staff) => {
      const record = filteredAttendance.find((a) => a.staffId === staff.id);
      return {
        staff,
        record,
      };
    })
    .filter(({ staff, record }) => {
      const matchesSearch =
        staff.name.includes(searchTerm) ||
        staff.positionTitle.includes(searchTerm) ||
        staff.className.includes(searchTerm);

      let matchesStatus = true;
      if (statusFilter === 'present') matchesStatus = record?.status === 'present';
      if (statusFilter === 'late') matchesStatus = record?.status === 'late';
      if (statusFilter === 'unregistered') matchesStatus = !record?.checkIn;

      return matchesSearch && matchesStatus;
    });

  const presentCount = filteredAttendance.filter((a) => a.status === 'present' || a.status === 'late').length;
  const lateCount = filteredAttendance.filter((a) => a.status === 'late').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              실시간 모니터링
            </span>
            <span className="text-xs text-slate-500">{selectedDate} 출퇴근 기록</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">교직원 실시간 근태 현황 관리</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            원내 교직원 출근/퇴근 시간 및 지각, 조퇴 현황을 실시간으로 기록하고 관리합니다.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-500 ml-2" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-800 border-none focus:outline-hidden cursor-pointer"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">전체 정원</p>
            <p className="text-xl font-bold text-slate-900">{allStaff.length}명</p>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">현재 출근 인원</p>
            <p className="text-xl font-bold text-emerald-600">{presentCount}명</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">지각 처리 인원</p>
            <p className="text-xl font-bold text-amber-600">{lateCount}명</p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="교사명, 학급 검색..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              statusFilter === 'all' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setStatusFilter('present')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              statusFilter === 'present' ? 'bg-white shadow-xs text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            정상출근
          </button>
          <button
            onClick={() => setStatusFilter('late')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              statusFilter === 'late' ? 'bg-white shadow-xs text-amber-800 font-bold' : 'text-slate-600'
            }`}
          >
            지각
          </button>
          <button
            onClick={() => setStatusFilter('unregistered')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              statusFilter === 'unregistered' ? 'bg-white shadow-xs text-rose-800 font-bold' : 'text-slate-600'
            }`}
          >
            미출근
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                <th className="py-3.5 px-4">교사명</th>
                <th className="py-3.5 px-4">직위 / 학급</th>
                <th className="py-3.5 px-4">출근 시각</th>
                <th className="py-3.5 px-4">퇴근 시각</th>
                <th className="py-3.5 px-4">근태 상태</th>
                <th className="py-3.5 px-4">비고 / 비고 메시지</th>
                <th className="py-3.5 px-4 text-center">수동 체크</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mergedStaffAttendance.map(({ staff, record }) => (
                <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{staff.name}</td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {staff.positionTitle} ({staff.className})
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                    {record?.checkIn || '-'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {record?.checkOut || '-'}
                  </td>
                  <td className="py-3.5 px-4">
                    {!record ? (
                      <span className="bg-slate-100 text-slate-500 font-medium px-2.5 py-0.5 rounded-full text-[11px]">
                        미출근
                      </span>
                    ) : record.status === 'present' ? (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                        정상 출근
                      </span>
                    ) : record.status === 'late' ? (
                      <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                        지각
                      </span>
                    ) : (
                      <span className="bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                        {record.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {record?.note || '특이사항 없음'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {!record?.checkIn ? (
                        <button
                          onClick={() => onCheckIn(staff.id)}
                          className="px-2.5 py-1 text-[11px] bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 cursor-pointer flex items-center gap-1"
                        >
                          <LogIn className="w-3 h-3" />
                          출근
                        </button>
                      ) : !record.checkOut ? (
                        <button
                          onClick={() => onCheckOut(staff.id)}
                          className="px-2.5 py-1 text-[11px] bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 cursor-pointer flex items-center gap-1"
                        >
                          <LogOut className="w-3 h-3" />
                          퇴근
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">완료됨</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
