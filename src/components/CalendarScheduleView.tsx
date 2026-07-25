import React, { useState } from 'react';
import { Holiday, TeacherSchedule, User, UserRole } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sun, CheckCircle, Sparkles, PlusCircle, Trash2, CalendarPlus, X } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isWeekend, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CalendarScheduleViewProps {
  holidays: Holiday[];
  schedules: TeacherSchedule[];
  users: User[];
  currentUser: User;
  onSaveSchedule: (schedule: {
    user_id: string;
    date: string;
    shift_type: 'early' | 'normal' | 'late' | 'off' | 'leave';
    note?: string;
  }) => Promise<void>;
  onAddHoliday?: (data: { date: string; title: string }) => Promise<void>;
  onDeleteHoliday?: (date: string) => Promise<void>;
}

export const CalendarScheduleView: React.FC<CalendarScheduleViewProps> = ({
  holidays,
  schedules,
  users,
  currentUser,
  onSaveSchedule,
  onAddHoliday,
  onDeleteHoliday
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date()); // Current month default
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);

  // Shift assignment state
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [shiftType, setShiftType] = useState<'early' | 'normal' | 'late' | 'off' | 'leave'>('early');
  const [shiftNote, setShiftNote] = useState<string>('');

  // Holiday management state
  const [newHolidayDate, setNewHolidayDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [newHolidayTitle, setNewHolidayTitle] = useState<string>('');
  const [quickHolidayTitle, setQuickHolidayTitle] = useState<string>('');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Count red days and total working hours in current month
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  let redDayCount = 0;
  let workingDayCount = 0;
  const currentMonthHolidays: Holiday[] = [];

  monthDays.forEach((day) => {
    const dStr = format(day, 'yyyy-MM-dd');
    const holiday = holidays.find((h) => h.date === dStr && h.is_public);
    if (holiday) {
      currentMonthHolidays.push(holiday);
    }
    if (isWeekend(day) || holiday) {
      redDayCount += 1;
    } else {
      workingDayCount += 1;
    }
  });

  const isManagerOrDirector = currentUser.role === 'manager' || currentUser.role === 'director';

  const handleOpenShiftModal = (dateStr: string) => {
    setSelectedDate(dateStr);
    setTargetUserId(users.find(u => u.role === 'teacher')?.id || currentUser.id);
    const existingHoliday = holidays.find(h => h.date === dateStr && h.is_public);
    setQuickHolidayTitle(existingHoliday ? existingHoliday.title : '지정 휴원일');
    setIsShiftModalOpen(true);
  };

  const handleSaveShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !targetUserId) return;

    try {
      await onSaveSchedule({
        user_id: targetUserId,
        date: selectedDate,
        shift_type: shiftType,
        note: shiftNote
      });
      setIsShiftModalOpen(false);
      setShiftNote('');
    } catch (err: any) {
      alert(err.message || '당직 스케줄 저장 중 오류가 발생했습니다.');
    }
  };

  const handleAddHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayTitle.trim()) {
      alert('날짜와 휴일/빨간날 명칭을 입력해 주세요.');
      return;
    }
    if (onAddHoliday) {
      await onAddHoliday({ date: newHolidayDate, title: newHolidayTitle.trim() });
      setNewHolidayTitle('');
    }
  };

  const handleAddQuickHoliday = async (dateStr: string) => {
    if (!quickHolidayTitle.trim()) {
      alert('휴일 명칭을 입력해 주세요.');
      return;
    }
    if (onAddHoliday) {
      await onAddHoliday({ date: dateStr, title: quickHolidayTitle.trim() });
    }
  };

  const handleDeleteHolidayClick = async (dateStr: string) => {
    if (window.confirm(`${dateStr} 날짜의 빨간날/지정휴원일 설정을 해제하시겠습니까?`)) {
      if (onDeleteHoliday) {
        await onDeleteHoliday(dateStr);
      }
    }
  };

  const getShiftBadge = (type: string) => {
    switch (type) {
      case 'early': return <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px]">당직 07:30</span>;
      case 'normal': return <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px]">정상 08:30</span>;
      case 'late': return <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold text-[10px]">마감 09:30</span>;
      case 'leave': return <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300 font-bold text-[10px]">연차/휴가</span>;
      case 'off': return <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 font-medium text-[10px]">휴무</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Month Header & Working Hours Summary Bar */}
      <div className="bg-white rounded-2xl border border-[#E9EDC9] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-center sm:text-left">
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-[#F1F3E9] rounded-xl border border-[#E9EDC9] text-[#344E41] cursor-pointer"
              title="이전 달"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <h2 className="text-lg sm:text-xl font-bold text-[#344E41] tracking-tight flex items-center justify-center gap-2">
              <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#718355]" />
              {format(currentMonth, 'yyyy년 M월', { locale: ko })} 어린이집 일정
            </h2>

            <button
              onClick={nextMonth}
              className="p-2 hover:bg-[#F1F3E9] rounded-xl border border-[#E9EDC9] text-[#344E41] cursor-pointer"
              title="다음 달"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Action Buttons: Red Day Management & Automatic Indicator */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 text-xs">
            {isManagerOrDirector && (
              <button
                onClick={() => {
                  setNewHolidayDate(format(new Date(), 'yyyy-MM-dd'));
                  setNewHolidayTitle('');
                  setIsHolidayModalOpen(true);
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                🔴 빨간날 추가 등록
              </button>
            )}

            <span className="bg-[#E9EDC9] text-[#344E41] border border-[#A3B18A]/50 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#718355] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#718355]"></span>
              </span>
              공휴일/대체휴일 자동 반영
            </span>
          </div>
        </div>

        {/* List of current month's public/substitute holidays if any */}
        {currentMonthHolidays.length > 0 && (
          <div className="bg-[#F1F3E9] border border-[#E9EDC9] rounded-xl p-2.5 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-rose-700 flex items-center gap-1 shrink-0">
              🔴 이달의 공휴일/대체휴일 ({currentMonthHolidays.length}개):
            </span>
            {currentMonthHolidays.map((h, i) => (
              <div key={i} className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-lg font-bold text-[11px]">
                <span>{format(parseISO(h.date), 'M/d(eee)', { locale: ko })} {h.title}</span>
                {isManagerOrDirector && (
                  <button
                    onClick={() => handleDeleteHolidayClick(h.date)}
                    className="hover:text-rose-950 ml-0.5 font-black text-xs cursor-pointer"
                    title="빨간날 해제"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Grid Calendar */}
      <div className="bg-white rounded-2xl border border-[#E9EDC9] overflow-hidden shadow-xs">
        
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-[#E9EDC9] bg-[#F1F3E9] text-center text-xs font-bold text-[#344E41] py-2.5">
          <div className="text-rose-600">일 (Sun)</div>
          <div>월 (Mon)</div>
          <div>화 (Tue)</div>
          <div>수 (Wed)</div>
          <div>목 (Thu)</div>
          <div>금 (Fri)</div>
          <div className="text-blue-600">토 (Sat)</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-[#E9EDC9]/50 bg-[#F1F3E9]/30">
          {calendarDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isCurrentMonthDay = isSameMonth(day, monthStart);
            const isSun = day.getDay() === 0;
            const isSat = day.getDay() === 6;

            // Find holiday matching date
            const holiday = holidays.find((h) => h.date === dateStr && h.is_public);
            const isRedDay = isSun || Boolean(holiday);

            // Find schedules for this date
            const dateSchedules = schedules.filter((s) => s.date === dateStr);

            return (
              <div
                key={dateStr}
                onClick={() => isCurrentMonthDay && isManagerOrDirector && handleOpenShiftModal(dateStr)}
                className={`min-h-[110px] p-2 transition-all flex flex-col justify-between ${
                  !isCurrentMonthDay ? 'bg-[#FDFCF8] text-[#A3B18A]' : 'bg-white hover:bg-[#F1F3E9]/50'
                } ${isRedDay ? 'bg-rose-50/30' : ''} ${
                  isManagerOrDirector ? 'cursor-pointer' : ''
                }`}
              >
                {/* Day Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                  <span
                    className={`text-xs sm:text-sm font-bold rounded-lg px-1 py-0.5 w-fit ${
                      !isCurrentMonthDay
                        ? 'text-[#A3B18A]'
                        : isRedDay
                        ? 'text-rose-600 bg-rose-50 font-black'
                        : isSat
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-[#344E41]'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {/* Holiday Title Badge */}
                  {holiday && (
                    <span className="text-[9px] sm:text-[10px] font-extrabold bg-rose-500 text-white px-1 sm:px-1.5 py-0.5 rounded leading-tight text-center shadow-2xs max-w-full break-all sm:break-normal">
                      {holiday.title}
                    </span>
                  )}
                </div>

                {/* Schedules list in date cell */}
                <div className="space-y-1 mt-1 grow">
                  {dateSchedules.map((sch, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[10px] bg-[#F1F3E9] p-1 rounded border border-[#E9EDC9]">
                      <span className="font-semibold text-[#344E41] truncate">{sch.user_name || '교사'}</span>
                      {getShiftBadge(sch.shift_type)}
                    </div>
                  ))}
                </div>

                {/* Mobile / Hover Prompt */}
                {isCurrentMonthDay && isManagerOrDirector && (
                  <div className="text-[9px] text-[#718355] text-right opacity-0 hover:opacity-100 transition-opacity pt-1 font-semibold">
                    + 일정/빨간날 편집
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Shift Assignment & Quick Red Day Modal */}
      {isShiftModalOpen && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E9EDC9] w-full max-w-md overflow-hidden">
            <div className="bg-[#F1F3E9] px-6 py-4 border-b border-[#E9EDC9] flex justify-between items-center">
              <div>
                <h3 className="font-bold text-[#344E41] text-base">{selectedDate} 일정 및 빨간날 설정</h3>
                <p className="text-xs text-[#718355]">근무/당직 배정 또는 휴원일(빨간날) 지정</p>
              </div>
              <button onClick={() => setIsShiftModalOpen(false)} className="text-[#A3B18A] hover:text-[#344E41] text-lg font-bold">×</button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              
              {/* Quick Red Day Setting / Unsetting Box */}
              <div className="bg-rose-50 rounded-xl p-3 border border-rose-200 space-y-2">
                <div className="font-bold text-rose-800 flex items-center gap-1.5">
                  <CalendarPlus className="w-4 h-4 text-rose-600" />
                  빨간날 / 지정휴원일 즉시 설정
                </div>

                {holidays.some(h => h.date === selectedDate && h.is_public) ? (
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-rose-200">
                    <span className="font-bold text-rose-700">
                      🔴 현재 빨간날 지정됨: {holidays.find(h => h.date === selectedDate)?.title}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleDeleteHolidayClick(selectedDate);
                        setIsShiftModalOpen(false);
                      }}
                      className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-xs hover:bg-rose-700 transition-colors cursor-pointer shrink-0"
                    >
                      빨간날 지정 해제
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="예: 지정휴원일, 개원기념일"
                      value={quickHolidayTitle}
                      onChange={(e) => setQuickHolidayTitle(e.target.value)}
                      className="grow border border-rose-200 rounded-lg px-2.5 py-1.5 text-[#344E41] bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        await handleAddQuickHoliday(selectedDate);
                        setIsShiftModalOpen(false);
                      }}
                      className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors shrink-0 cursor-pointer"
                    >
                      빨간날 지정
                    </button>
                  </div>
                )}
              </div>

              {/* Shift Assignment Form */}
              <form onSubmit={handleSaveShiftSubmit} className="space-y-3.5 pt-2 border-t border-[#E9EDC9]">
                <div className="font-bold text-[#344E41] text-xs">교사 당직/근무 배정</div>
                <div>
                  <label className="block font-bold text-[#344E41] mb-1">대상 교사 선택 *</label>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41]"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.position || (u.role === 'director' ? '원장' : '교사')} - {u.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#344E41] mb-1">근무 구분 / 당직 *</label>
                  <select
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value as any)}
                    className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41]"
                  >
                    <option value="early">당직 출근 (07:30 ~ 16:30)</option>
                    <option value="normal">정상 출근 (08:30 ~ 17:30)</option>
                    <option value="late">마감 출근 (09:30 ~ 18:30)</option>
                    <option value="leave">연차 / 휴가</option>
                    <option value="off">휴무</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#344E41] mb-1">메모</label>
                  <input
                    type="text"
                    placeholder="예: 영아반 통합보육 담당"
                    value={shiftNote}
                    onChange={(e) => setShiftNote(e.target.value)}
                    className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41]"
                  />
                </div>

                <div className="pt-3 border-t border-[#E9EDC9] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsShiftModalOpen(false)}
                    className="px-4 py-2 border border-[#E9EDC9] rounded-xl font-semibold text-[#344E41]"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#718355] text-white font-bold rounded-xl hover:bg-[#5f6f45] cursor-pointer"
                  >
                    스케줄 저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Red Day / Holiday Management Modal */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E9EDC9] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-rose-50 px-6 py-4 border-b border-rose-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-rose-900 text-base flex items-center gap-2">
                  <CalendarPlus className="w-5 h-5 text-rose-600" />
                  🔴 빨간날 (공휴일 / 지정휴원일) 추가 등록
                </h3>
                <p className="text-xs text-rose-700 mt-0.5">원하시는 날짜를 빨간날(휴일)로 자유롭게 지정하고 등록할 수 있습니다.</p>
              </div>
              <button
                onClick={() => setIsHolidayModalOpen(false)}
                className="text-rose-400 hover:text-rose-800 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Form to Register New Red Day */}
              <form onSubmit={handleAddHolidaySubmit} className="bg-[#F1F3E9] p-4 rounded-xl border border-[#E9EDC9] space-y-3">
                <div className="font-bold text-[#344E41]">새 빨간날/지정휴원일 추가</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-[#344E41] mb-1">날짜 선택 *</label>
                    <input
                      type="date"
                      value={newHolidayDate}
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41] bg-white focus:ring-2 focus:ring-[#718355]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#344E41] mb-1">휴일/빨간날 명칭 *</label>
                    <input
                      type="text"
                      placeholder="예: 개원기념일, 재량휴무"
                      value={newHolidayTitle}
                      onChange={(e) => setNewHolidayTitle(e.target.value)}
                      className="w-full border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41] bg-white focus:ring-2 focus:ring-[#718355]"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                  >
                    🔴 빨간날 등록
                  </button>
                </div>
              </form>

              {/* List of Registered Holidays */}
              <div className="space-y-2">
                <div className="font-bold text-[#344E41] text-xs flex items-center justify-between">
                  <span>등록된 공휴일/대체휴일 목록 ({holidays.length}개)</span>
                  <span className="text-[11px] text-[#718355] font-normal">필요 시 해제 가능</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 border border-[#E9EDC9] rounded-xl p-2 bg-[#FDFCF8]">
                  {holidays.map((h) => (
                    <div
                      key={h.date}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E9EDC9] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-600 w-24 shrink-0">{h.date}</span>
                        <span className="font-semibold text-[#344E41]">{h.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteHolidayClick(h.date)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer"
                        title="빨간날 해제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-4 bg-[#F1F3E9] border-t border-[#E9EDC9] flex justify-end">
              <button
                type="button"
                onClick={() => setIsHolidayModalOpen(false)}
                className="px-5 py-2 bg-[#718355] text-white font-bold rounded-xl hover:bg-[#5f6f45] cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
